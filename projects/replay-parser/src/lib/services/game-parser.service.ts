import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { Entity } from '../models/game/entity';
import { Game } from '../models/game/game';
import { HistoryItem } from '../models/history/history-item';
import { AllCardsService } from './all-cards.service';
import { GamePopulationService } from './entitiespipeline/game-population.service';
import { GameStateParserService } from './entitiespipeline/game-state-parser.service';
import { ActionParserService } from './gamepipeline/action-parser.service';
import { ActivePlayerParserService } from './gamepipeline/active-player-parser.service';
import { ActiveSpellParserService } from './gamepipeline/active-spell-parser.service';
import { EndGameParserService } from './gamepipeline/end-game-parser.service';
import { GameInitializerService } from './gamepipeline/game-initializer.service';
import { MulliganParserService } from './gamepipeline/mulligan-parser.service';
import { NarratorService } from './gamepipeline/narrator.service';
import { TargetsParserService } from './gamepipeline/targets-parser.service';
import { TurnParserService } from './gamepipeline/turn-parser.service';
import { ImagePreloaderService } from './image-preloader.service';
import { StateProcessorService } from './state-processor.service';
import { XmlParserService } from './xml-parser.service';

const SMALL_PAUSE = 7;

@Injectable({
	providedIn: 'root',
})
export class GameParserService {
	constructor(
		private allCards: AllCardsService,
		private actionParser: ActionParserService,
		private turnParser: TurnParserService,
		private imagePreloader: ImagePreloaderService,
		private gamePopulationService: GamePopulationService,
		private gameStateParser: GameStateParserService,
		private gameInitializer: GameInitializerService,
		private activePlayerParser: ActivePlayerParserService,
		private activeSpellParser: ActiveSpellParserService,
		private targetsParser: TargetsParserService,
		private mulliganParser: MulliganParserService,
		private endGameParser: EndGameParserService,
		private narrator: NarratorService,
		private logger: NGXLogger,
		private stateProcessor: StateProcessorService,
	) {}
	private cancelled: boolean;
	private processingTimeout;

	public static async create(): Promise<GameParserService> {
		const getRequest = (url: string): Promise<any> => {
			return new Promise<any>(function(resolve, reject) {
				console.log('preparing XMLHttpRequest replacemenet');
				let requestIssuer;
				try {
					requestIssuer = XMLHttpRequest;
				} catch (e) {
					console.log('redefining XMLHttpRequest');
					requestIssuer = require('xhr2');
				}
				// console.log('requestIssuer', requestIssuer);
				// console.log('http', require('http'));
				const request = new requestIssuer();
				request.onload = function() {
					if (this.status === 200) {
						resolve(this.response);
					} else {
						reject(new Error(this.statusText));
					}
				};
				// request.onerror = function() {
				// 	reject(new Error('requestIssuer Error: ' + this.statusText));
				// };
				request.open('GET', url);
				request.send();
			});
		};
		const cardsStr = await getRequest('https://static.zerotoheroes.com/hearthstone/jsoncards/cards.json');
		const cardsArray: any[] = JSON.parse(cardsStr);
		console.log('loaded', cardsArray.length, 'cards');
		const logger: NGXLogger = {
			debug: (message: any, ...additional: any[]) => {}, // Turn off debug logs
			log: (message: any, ...additional: any[]) => console.log(message, additional),
			info: (message: any, ...additional: any[]) => console.info(message, additional),
			warn: (message: any, ...additional: any[]) => console.warn(message, additional),
			error: (message: any, ...additional: any[]) => console.error(message, additional),
		} as NGXLogger;
		const httpClient: HttpClient = {} as HttpClient;
		const allCards = new AllCardsService(httpClient, logger);
		allCards['allCards'] = cardsArray;
		const stateProcessor = new StateProcessorService(logger);
		const actionParser = new ActionParserService(logger, allCards, stateProcessor);
		const turnParser = new TurnParserService(logger);
		const imagePreloader = new ImagePreloaderService(logger, allCards);
		const gamePopulationService = new GamePopulationService(allCards, logger);
		const gameStateParser = new GameStateParserService();
		const gameInitializer = new GameInitializerService();
		const activePlayerParser = new ActivePlayerParserService(logger, allCards);
		const activeSpellParser = new ActiveSpellParserService(logger, allCards);
		const targetsParser = new TargetsParserService(logger, allCards);
		const mulliganParser = new MulliganParserService(logger, allCards);
		const endGameParser = new EndGameParserService(logger, allCards);
		const narrator = new NarratorService(logger);
		return new GameParserService(
			allCards,
			actionParser,
			turnParser,
			imagePreloader,
			gamePopulationService,
			gameStateParser,
			gameInitializer,
			activePlayerParser,
			activeSpellParser,
			targetsParser,
			mulliganParser,
			endGameParser,
			narrator,
			logger,
			stateProcessor,
		);
	}

	public async parse(
		replayAsString: string,
		options?: GameParsingOptions,
	): Promise<Observable<[Game, string, boolean]>> {
		const start = Date.now();
		this.cancelled = false;
		if (this.processingTimeout) {
			clearTimeout(this.processingTimeout);
			this.processingTimeout = undefined;
		}
		await this.allCards.initializeCardsDb();
		this.logPerf('Retrieved cards DB, parsing replay', start);

		const iterator: IterableIterator<[Game, number, string]> = this.createGamePipeline(
			replayAsString,
			start,
			options,
		);
		return Observable.create(observer => {
			this.buildObservableFunction(observer, iterator);
		});
	}

	public cancelProcessing(): void {
		this.cancelled = true;
		clearTimeout(this.processingTimeout);
	}

	private buildObservableFunction(observer, iterator: IterableIterator<[Game, number, string]>) {
		// this.logger.info('calling next iteration');
		const itValue = iterator.next();
		// this.logger.info('calling next obersable', itValue, itValue.value);
		observer.next([itValue.value[0], itValue.value[2], itValue.done]);
		if (!itValue.done && !this.cancelled) {
			this.processingTimeout = setTimeout(
				() => this.buildObservableFunction(observer, iterator),
				itValue.value[1],
			);
		}
	}

	private *createGamePipeline(
		replayAsString: string,
		start: number,
		options?: GameParsingOptions,
	): IterableIterator<[Game, number, string]> {
		const history: readonly HistoryItem[] = new XmlParserService(this.logger).parseXml(replayAsString);
		this.logPerf('XML parsing', start);
		if (!options || options.shouldYield) {
			yield [null, SMALL_PAUSE, 'XML parsing done'];
		}

		try {
			const preloadIterator = this.imagePreloader.preloadImages(history);
			while (true) {
				const itValue = preloadIterator.next();
				if (!options || options.shouldYield) {
					yield [null, SMALL_PAUSE, null];
				}
				if (itValue.done) {
					break;
				}
			}
			if (!options || options.shouldYield) {
				yield [null, SMALL_PAUSE, 'Images preloading started'];
			}
			this.logPerf('Started image preloading', start);
		} catch (e) {
			this.logger.debug('not preloading images, probably in node environment');
		}

		const initialEntities = this.gamePopulationService.populateInitialEntities(history);
		this.logPerf('Populating initial entities', start);
		if (!options || options.shouldYield) {
			yield [null, SMALL_PAUSE, 'Populated initial entities'];
		}

		const entities: Map<number, Entity> = this.gameStateParser.populateEntitiesUntilMulliganState(
			history,
			initialEntities,
		);
		this.logPerf('Populating entities with mulligan state', start);
		if (!options || options.shouldYield) {
			yield [null, SMALL_PAUSE, 'Prepared Mulligan state'];
		}

		const gameWithPlayers: Game = this.gameInitializer.initializeGameWithPlayers(history, entities);
		this.logPerf('initializeGameWithPlayers', start);
		if (!options || options.shouldYield) {
			yield [gameWithPlayers, SMALL_PAUSE, 'Initialized Game'];
		}

		const gameWithTurns: Game = this.turnParser.createTurns(gameWithPlayers, history);
		this.logPerf('createTurns', start);
		if (!options || options.shouldYield) {
			yield [gameWithTurns, SMALL_PAUSE, 'Created turns'];
		}

		const iterator = this.actionParser.parseActions(gameWithTurns, history);
		let previousStep = gameWithTurns;
		while (true) {
			const itValue = iterator.next();
			const step = itValue.value[0] || previousStep;
			previousStep = step;
			if (!options || options.shouldYield) {
				yield [step, SMALL_PAUSE, 'Finished processing turn ' + itValue.value[1]];
			}
			if (itValue.done) {
				break;
			}
		}
		this.logPerf('parseActions', start);

		if (options && options.skipUi) {
			return [previousStep, SMALL_PAUSE, 'Rendering game state'];
		}

		const gameWithActivePlayer: Game = this.activePlayerParser.parseActivePlayer(previousStep);
		this.logPerf('activePlayerParser', start);
		if (!options || options.shouldYield) {
			yield [gameWithActivePlayer, SMALL_PAUSE, 'Parsed active players'];
		}

		const gameWithActiveSpell: Game = this.activeSpellParser.parseActiveSpell(gameWithActivePlayer);
		this.logPerf('activeSpellParser', start);
		if (!options || options.shouldYield) {
			yield [gameWithActiveSpell, SMALL_PAUSE, 'Parsed active spells'];
		}

		const gameWithTargets: Game = this.targetsParser.parseTargets(gameWithActiveSpell);
		this.logPerf('targets', start);
		if (!options || options.shouldYield) {
			yield [gameWithTargets, SMALL_PAUSE, 'Parsed targets'];
		}

		const gameWithMulligan: Game = this.mulliganParser.affectMulligan(gameWithTargets);
		this.logPerf('affectMulligan', start);
		if (!options || options.shouldYield) {
			yield [gameWithMulligan, SMALL_PAUSE, null];
		}

		const gameWithEndGame: Game = this.endGameParser.parseEndGame(gameWithMulligan);
		this.logPerf('parseEndGame', start);
		if (!options || options.shouldYield) {
			yield [gameWithEndGame, SMALL_PAUSE, 'Parsed end game'];
		}

		const gameWithNarrator: Game = this.narrator.populateActionText(gameWithEndGame);
		this.logPerf('populateActionText', start);
		// console.log(gameWithNarrator.fullStoryRaw);
		if (!options || options.shouldYield) {
			yield [gameWithNarrator, SMALL_PAUSE, 'Populated actions text'];
		}

		const gameWithFullStory: Game = this.narrator.createGameStory(gameWithNarrator);
		this.logPerf('game story', start);
		return [gameWithFullStory, SMALL_PAUSE, 'Rendering game state'];
	}

	private logPerf<T>(what: string, start: number, result?: T): T {
		this.logger.info('[perf] ', what, 'done after ', Date.now() - start, 'ms');
		return result;
	}
}

export interface GameProcessingStep {
	game: Game;
	shouldBubble: boolean;
}

export interface GameParsingOptions {
	readonly shouldYield: number;
	readonly skipUi: boolean;
}

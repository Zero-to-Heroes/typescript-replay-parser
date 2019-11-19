import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { Game } from '../models/game/game';
import { HistoryItem } from '../models/history/history-item';
import { ActionParserConfig, GameHistoryItem } from '../models/models';
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

const SMALL_PAUSE = 30;

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
		options?: TechnicalParsingOptions,
		config: ActionParserConfig = new ActionParserConfig(),
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
			config,
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
		options: TechnicalParsingOptions,
		config: ActionParserConfig,
	): IterableIterator<[Game, number, string]> {
		if (!replayAsString || replayAsString.length == 0) {
			return [null, SMALL_PAUSE, 'Invalid XML replay'];
		}

		// Do the parsing turn by turn
		// let history: readonly HistoryItem[];
		const xmlParsingIterator: IterableIterator<readonly HistoryItem[]> = new XmlParserService(this.logger).parseXml(
			replayAsString,
		);
		let game: Game = Game.createGame({} as Game);
		let counter = 0;
		while (true) {
			const itValue = xmlParsingIterator.next();
			const history: readonly HistoryItem[] = itValue.value;

			if (itValue.done) {
				console.log('history parsing over', itValue);
				break;
			}

			if (history[0] instanceof GameHistoryItem) {
				const gameHistory: GameHistoryItem = history[0] as GameHistoryItem;
				game = Object.assign(game, {
					buildNumber: gameHistory.buildNumber,
					formatType: gameHistory.formatType,
					gameType: gameHistory.gameType,
					scenarioID: gameHistory.scenarioID,
				} as Game);
				console.log('assign meta data to game', game);
			}

			if (game.turns.size === 5) {
				return;
			}

			// const debug = game.turns.size === 33;
			// console.log(
			// 	'handling turn',
			// 	game.turns.size,
			// 	counter,
			// 	'\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n',
			// );

			// Preload the images we'll need early on
			const preloadIterator = this.imagePreloader.preloadImages(history);
			while (true) {
				const itValue = preloadIterator.next();
				if (itValue.done) {
					break;
				}
			}

			let entities = this.gamePopulationService.initNewEntities(game, history);
			// if (debug || game.turns.size === 32) {
			// 	console.log('=======game after initNewEntities', entities.toJS(), entities.get(507));
			// }
			if (game.turns.size === 0) {
				game = this.gameInitializer.initializePlayers(game, entities);
				entities = this.gameStateParser.updateEntitiesUntilMulliganState(game, entities, history);
				// console.log('game after populateEntitiesUntilMulliganState', game, game.turns.toJS());
			}

			// if (game.turns.size === 1) {
			// 	return;
			// }

			game = this.turnParser.createTurns(game, history);
			// console.log('game after turn creation', game.turns.size);
			game = this.actionParser.parseActions(game, entities, history, config);
			// console.log('game after action pasring', game.getLatestParsedState().toJS());
			if (game.turns.size > 0) {
				game = this.activePlayerParser.parseActivePlayerForLastTurn(game);
				// console.log('game after parseActivePlayer', game, game.turns.toJS());
				game = this.activeSpellParser.parseActiveSpellForLastTurn(game);
				// console.log('game after parseActiveSpell', game, game.turns.toJS());
				game = this.targetsParser.parseTargetsForLastTurn(game);
				// console.log('game after parseTargets', game, game.turns.toJS());
				if (game.turns.size === 1) {
					game = this.mulliganParser.affectMulligan(game);
				}
				// console.log('game after affectMulligan', game, game.turns.toJS());
				game = this.endGameParser.parseEndGame(game);
				// console.log('game after parseEndGame', game, game.turns.toJS());
				game = this.narrator.populateActionTextForLastTurn(game);
				// console.log('game after populateActionText', game, game.turns.toJS());
				game = this.narrator.createGameStoryForLastTurn(game);
				// console.log('game after createGameStory', game, game.turns.toJS());
				// if (counter === 4) {
				// 	counter++;
				// 	console.log('returning', counter);
				// 	return [game, SMALL_PAUSE, 'Rendering game state'];
				// }
				// counter++;
				// console.log('moving on', counter);
				// if (game.turns.size === 33) {
				// 	console.log(
				// 		'entities at end of turn',
				// 		game.getLatestParsedState().toJS(),
				// 		game.getLatestParsedState().get(507),
				// 	);
				// }

				yield [game, SMALL_PAUSE, 'Parsed turn ' + counter++];
			} else {
				// if (counter++ === 3) {
				// 	counter++;
				// 	// console.log('returning', counter, game.entities.get(73), game.entities.get(74));
				// 	return [game, SMALL_PAUSE, 'Rendering game state'];
				// }
				// counter++;
			}
		}
		console.log('parsing done, returning');
		return [game, SMALL_PAUSE, 'Rendering game state'];
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

export interface TechnicalParsingOptions {
	readonly shouldYield: number;
	readonly skipUi: boolean;
}

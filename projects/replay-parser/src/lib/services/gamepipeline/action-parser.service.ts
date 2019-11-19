import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { Action } from '../../models/action/action';
import { Entity } from '../../models/game/entity';
import { Game } from '../../models/game/game';
import { HistoryItem } from '../../models/history/history-item';
import { ActionParserConfig } from '../../models/models';
import { AttachingEnchantmentParser } from '../action/attaching-enchantment-parser';
import { AttackParser } from '../action/attack-parser';
import { BaconBattleOverParser } from '../action/battlegrounds/bacon-battle-over-parser';
import { BaconBoardVisualStateParser } from '../action/battlegrounds/bacon-board-visual-state-parser';
import { BaconOpponentRevealedParser } from '../action/battlegrounds/bacon-opponent-revealed-parser';
import { CardBurnParser } from '../action/card-burn-parser';
import { CardDiscardParser } from '../action/card-discard-parser';
import { CardDrawParser } from '../action/card-draw-parser';
import { CardPlayedFromHandParser } from '../action/card-played-from-hand-parser';
import { CardTargetParser } from '../action/card-target-parser';
import { DamageParser } from '../action/damage-parser';
import { DiscoverParser } from '../action/discover-parser';
import { DiscoveryPickParser } from '../action/discovery-pick-parser';
import { EndGameParser } from '../action/end-game-parser';
import { FatigueDamageParser } from '../action/fatigue-damage-parser';
import { HeroPowerUsedParser } from '../action/hero-power-used-parser';
import { MinionDeathParser } from '../action/minion-death-parser';
import { MulliganCardChoiceParser } from '../action/mulligan-card-choice-parser';
import { MulliganCardParser } from '../action/mulligan-card-parser';
import { OptionsParser } from '../action/options-parser';
import { Parser } from '../action/parser';
import { PowerTargetParser } from '../action/power-target-parser';
import { QuestCompletedParser } from '../action/quest-completed-parser';
import { SecretPlayedFromHandParser } from '../action/secret-played-from-hand-parser';
import { SecretRevealedParser } from '../action/secret-revealed-parser';
import { StartOfMulliganParser } from '../action/start-of-mulligan-parser';
import { StartTurnParser } from '../action/start-turn-parser';
import { SummonsParser } from '../action/summons-parser';
import { AllCardsService } from '../all-cards.service';
import { StateProcessorService } from '../state-processor.service';

@Injectable({
	providedIn: 'root',
})
export class ActionParserService {
	constructor(
		private logger: NGXLogger,
		private allCards: AllCardsService,
		private stateProcessorService: StateProcessorService,
	) {}

	private registerActionParsers(config: ActionParserConfig): Parser[] {
		return [
			new StartTurnParser(this.allCards),
			new MulliganCardParser(this.allCards, this.logger),
			new MulliganCardChoiceParser(this.allCards, this.logger),
			new StartOfMulliganParser(this.allCards),
			new CardDrawParser(this.allCards, this.logger),
			new CardBurnParser(this.allCards, this.logger),
			new HeroPowerUsedParser(this.allCards),
			new CardPlayedFromHandParser(this.allCards),
			new SecretPlayedFromHandParser(this.allCards),
			new AttackParser(this.allCards),
			new MinionDeathParser(this.allCards),
			new PowerTargetParser(this.allCards, this.logger),
			new CardTargetParser(this.allCards, this.logger),
			new DiscoverParser(this.allCards),
			new DiscoveryPickParser(this.allCards, this.logger),
			new SummonsParser(this.allCards),
			new SecretRevealedParser(this.allCards),
			new AttachingEnchantmentParser(this.allCards, config),
			new DamageParser(this.allCards, this.logger),
			new CardDiscardParser(this.allCards, this.logger),
			new OptionsParser(this.allCards, this.logger),
			new EndGameParser(this.logger, this.allCards),
			new FatigueDamageParser(this.allCards, this.logger),
			new QuestCompletedParser(this.allCards, this.logger),
			new BaconOpponentRevealedParser(this.allCards, this.logger),
			new BaconBoardVisualStateParser(this.allCards),
			new BaconBattleOverParser(this.allCards),
		];
	}

	public parseActions(
		game: Game,
		entities: Map<number, Entity>,
		history: readonly HistoryItem[],
		config: ActionParserConfig = new ActionParserConfig(),
		debug = false,
	): Game {
		// const start = Date.now();
		// Because mulligan is effectively index -1; since there is a 0 turn after that
		let currentTurn = game.turns.size - 1;
		// console.log('current turn at start', currentTurn);
		let actionsForTurn: readonly Action[] = [];
		let previousStateEntities: Map<number, Entity> = entities;
		let previousProcessedItem: HistoryItem = history[0];
		// let turns: Map<number, Turn> = game.turns;
		// Recreating this every time lets the parsers store state and emit the action only when necessary
		const actionParsers: Parser[] = this.registerActionParsers(config);

		// let turnStart = Date.now();
		// let parserDurationForTurn = 0;
		for (const item of history) {
			// const start = Date.now();
			const entitiesBeforeAction = previousStateEntities;
			previousStateEntities = this.stateProcessorService.applyHistoryItem(previousStateEntities, item);
			// if (debug) {
			// 	console.log('is entity present', entitiesBeforeAction.has(507), previousStateEntities.has(507), item);
			// }
			previousProcessedItem = item;
			actionParsers.forEach(parser => {
				if (parser.applies(item)) {
					// const start = Date.now();
					// When we perform an action, we want to show the result of the state updates until the next action is
					// played.
					// console.log('parser might apply', parser, item);
					const actions: Action[] = parser.parse(
						item,
						currentTurn,
						entitiesBeforeAction,
						history,
						game.players,
					);
					if (actions && actions.length > 0) {
						// console.log('parser applies', parser, item);
						actionsForTurn = this.fillMissingEntities(actionsForTurn, entitiesBeforeAction);
						actionsForTurn = [...actionsForTurn, ...actions];
					}
				}
			});
		}

		previousStateEntities = this.stateProcessorService.applyHistoryUntilEnd(
			previousStateEntities,
			history,
			previousProcessedItem,
		);
		// console.log('previousStateEntities after history parsing', previousStateEntities.toJS());
		// if (debug) {
		// 	console.log('is entity present', previousStateEntities.has(507));
		// }
		actionsForTurn = this.fillMissingEntities(actionsForTurn, previousStateEntities);
		// console.log(
		// 	'actionsForTurn after fillMissingEntities',
		// 	actionsForTurn[actionsForTurn.length - 1].entities.toJS(),
		// );
		// Sort actions based on their index (so that actions that were created from the same
		// parent action can have a custom order)
		actionsForTurn = this.sortActions(
			actionsForTurn,
			(a: Action, b: Action) => a.index - b.index || a.timestamp - b.timestamp,
		);
		// console.log('actionsForTurn after sortActions', actionsForTurn[actionsForTurn.length - 1].entities.toJS());
		// if (debug) {
		// 	console.log('is entity present after sort', actionsForTurn[actionsForTurn.length - 1].entities.has(507));
		// }
		// Give an opportunity to each parser to combine the actions it produced by merging them
		// For instance, if we two card draws in a row, we might want to display them as a single
		// action that draws two cards
		actionsForTurn = this.reduceActions(actionParsers, actionsForTurn);
		// console.log('actionsForTurn after reduceActions', actionsForTurn[actionsForTurn.length - 1].entities.toJS());
		actionsForTurn = this.addDamageToEntities(actionsForTurn, previousStateEntities);
		// console.log(
		// 	'actionsForTurn after addDamageToEntities',
		// 	actionsForTurn[actionsForTurn.length - 1].entities.toJS(),
		// );
		// if (debug) {
		// 	console.log('is entity present after damage', actionsForTurn[actionsForTurn.length - 1].entities.has(507));
		// }
		try {
			if (currentTurn < 0) {
				// console.log('handling game init entity updates');
				return Game.createGame(game, { entitiesBeforeMulligan: previousStateEntities } as Game);
			}
			if (!game.turns.get(currentTurn)) {
				this.logger.warn('could not get current turn', currentTurn, game.turns.toJS());
			}
			const turnWithNewActions = game.turns.get(currentTurn).update({ actions: actionsForTurn });
			// if (debug) {
			// 	console.log(
			// 		'is entity present after turnWithNewActions',
			// 		turnWithNewActions.actions[turnWithNewActions.actions.length - 1].entities.has(507),
			// 	);
			// }
			const turnNumber = turnWithNewActions.turn === 'mulligan' ? 0 : parseInt(turnWithNewActions.turn);
			const turns = game.turns.set(turnNumber, turnWithNewActions);
			// console.log(
			// 	'turnWithNewActions',
			// 	turnWithNewActions.actions[turnWithNewActions.actions.length - 1].entities.toJS(),
			// );
			// actionsForTurn = [];
			// if (debug) {
			// 	console.log(
			// 		'is entity present after turns set',
			// 		turns.get(turnNumber).actions[turns.get(turnNumber).actions.length - 1].entities.has(507),
			// 	);
			// }
			const result = Game.createGame(game, { turns } as Game);
			// console.log('oriejg', result.getLatestParsedState().toJS());
			return result;
		} catch (e) {
			this.logger.warn(currentTurn, game.turns.toJS(), actionsForTurn);
			this.logger.error(e);
			return game;
		}
		// this.logger.log('took', Date.now() - start, 'ms for parseActions');
	}

	private fillMissingEntities(
		actionsForTurn: readonly Action[],
		previousStateEntities: Map<number, Entity>,
	): readonly Action[] {
		const newActionsForTurn = [];
		for (let i = 0; i < actionsForTurn.length; i++) {
			if (actionsForTurn[i].entities) {
				newActionsForTurn.push(actionsForTurn[i]);
			} else {
				newActionsForTurn.push(actionsForTurn[i].update(previousStateEntities));
			}
		}
		return newActionsForTurn;
	}

	private addDamageToEntities(
		actionsForTurn: readonly Action[],
		previousStateEntities: Map<number, Entity>,
	): readonly Action[] {
		const newActionsForTurn = [];
		for (let i = 0; i < actionsForTurn.length; i++) {
			if (!actionsForTurn[i]) {
				console.warn('BBBB', actionsForTurn);
			}
			const newEntities = actionsForTurn[i].entities ? actionsForTurn[i].entities : previousStateEntities;
			const entitiesAfterDamageUpdate: Map<number, Entity> = newEntities
				.map(entity => this.updateDamageForEntity(actionsForTurn[i], entity))
				.toMap();
			newActionsForTurn.push(actionsForTurn[i].update(entitiesAfterDamageUpdate));
		}
		return newActionsForTurn;
	}

	private updateDamageForEntity(action: Action, entity: Entity): Entity {
		const damages: Map<number, number> = action.damages;
		const damage = damages.get(entity.id);
		return entity.updateDamage(damage);
	}

	// private updateCurrentTurn(item: HistoryItem, game: Game, actions: readonly Action[], currentTurn): [Turn, number] {
	// 	if (
	// 		actions.length > 1 &&
	// 		actions[actions.length - 1] instanceof StartTurnAction &&
	// 		!(actions[actions.length - 1] as StartTurnAction).isStartOfMulligan
	// 	) {
	// 		const turnToUpdate: Turn = game.turns.get(currentTurn);
	// 		return [turnToUpdate, currentTurn + 1];
	// 	}
	// 	return [null, currentTurn];
	// }

	private reduceActions(actionParsers: Parser[], actionsForTurn: readonly Action[]): readonly Action[] {
		let reducedActions = actionsForTurn;
		for (const parser of actionParsers) {
			// console.log('reducing', parser, actionsForTurn);
			reducedActions = parser.reduce(reducedActions);
		}
		// Because the different parsers can interact with each other, we need to apply all
		// of them until the result doesn't change anymore
		// This looks heavy in perf, but there aren't many actions, and it lets us
		// handle each action type independently, which makes for more separated concerns
		if (!this.areEqual(reducedActions, actionsForTurn)) {
			return this.reduceActions(actionParsers, reducedActions);
		}
		return reducedActions;
	}

	private sortActions<T>(array: readonly T[], sortingFunction: (a: T, b: T) => number): readonly T[] {
		const intermediate: T[] = [...array];
		intermediate.sort(sortingFunction);
		return intermediate as readonly T[];
	}

	private areEqual(actions1: readonly Action[], actions2: readonly Action[]): boolean {
		if (actions1.length !== actions2.length) {
			return false;
		}
		for (let i = 0; i < actions1.length; i++) {
			if (actions1[i] !== actions2[i]) {
				return false;
			}
		}
		return true;
	}
}

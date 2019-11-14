import { GameTag, Mulligan, Step } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class StartTurnParser implements Parser {
	constructor(private readonly allCards: AllCardsService) {}
	public applies(item: HistoryItem): boolean {
		return (
			item instanceof TagChangeHistoryItem &&
			((item.tag.tag === GameTag.STEP && item.tag.value === Step.MAIN_READY) ||
				(item.tag.tag === GameTag.MULLIGAN_STATE && item.tag.value === Mulligan.INPUT))
		);
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		console.log('current turn?', currentTurn);
		if (item.tag.tag === GameTag.MULLIGAN_STATE && item.tag.value === Mulligan.INPUT) {
			return [
				StartTurnAction.create(
					{
						timestamp: item.timestamp,
						turn: currentTurn,
						index: item.index,
					},
					this.allCards,
				),
			];
		} else {
			const activePlayerId = entitiesBeforeAction
				.filter(entity => entity.getTag(GameTag.CURRENT_PLAYER) === 1)
				.map(entity => entity as PlayerEntity)
				.first().playerId;
			return [
				StartTurnAction.create(
					{
						timestamp: item.timestamp,
						turn: currentTurn,
						activePlayer: activePlayerId,
						index: item.index,
					},
					this.allCards,
				),
			];
		}
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}

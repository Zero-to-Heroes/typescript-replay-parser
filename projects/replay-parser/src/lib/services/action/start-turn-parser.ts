import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { GameTag } from '../../models/enums/game-tags';
import { Step } from '../../models/enums/step';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { Parser } from './parser';

export class StartTurnParser implements Parser {
	public applies(item: HistoryItem): boolean {
		return item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.STEP && item.tag.value === Step.MAIN_READY;
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		const activePlayerId = entitiesBeforeAction
			.filter(entity => entity.getTag(GameTag.CURRENT_PLAYER) === 1)
			.map(entity => entity as PlayerEntity)
			.first().playerId;
		return [
			StartTurnAction.create({
				timestamp: item.timestamp,
				turn: currentTurn + 1,
				activePlayer: activePlayerId,
				index: item.index,
			}),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}

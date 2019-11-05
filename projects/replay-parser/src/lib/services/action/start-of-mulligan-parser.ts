import { GameTag, Step } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { Parser } from './parser';

export class StartOfMulliganParser implements Parser {
	private numberOfMulligansDone = 0;

	public applies(item: HistoryItem): boolean {
		return (
			item instanceof TagChangeHistoryItem &&
			item.tag.tag === GameTag.STEP &&
			item.tag.value === Step.BEGIN_MULLIGAN
		);
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (this.numberOfMulligansDone > 0) {
			return [];
		}
		this.numberOfMulligansDone++;
		return [
			StartTurnAction.create({
				timestamp: item.timestamp,
				turn: currentTurn,
				isStartOfMulligan: true,
				index: item.index,
			}),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}

import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { HeroPowerUsedAction } from '../../models/action/hero-power-used-action';
import { BlockType } from '../../models/enums/block-type';
import { CardType } from '../../models/enums/card-type';
import { GameTag } from '../../models/enums/game-tags';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class HeroPowerUsedParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ActionHistoryItem;
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (parseInt(item.node.attributes.type) !== BlockType.PLAY) {
			return;
		}

		const entity = entitiesBeforeAction.get(parseInt(item.node.attributes.entity));
		if (!entity) {
			return [];
		}
		if (entity.getTag(GameTag.CARDTYPE) === CardType.HERO_POWER) {
			return [
				HeroPowerUsedAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						entityId: entity.id,
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

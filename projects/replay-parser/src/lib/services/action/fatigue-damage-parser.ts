import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { Action } from '../../models/action/action';
import { FatigueDamageAction } from '../../models/action/fatigue-damage-action';
import { GameTag } from '../../models/enums/game-tags';
import { Entity } from '../../models/game/entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class FatigueDamageParser implements Parser {
  constructor(private allCards: AllCardsService, private logger: NGXLogger) {}

  public applies(item: HistoryItem): boolean {
	return (
		item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.FATIGUE
	);
  }

  public parse(
	item: TagChangeHistoryItem,
	currentTurn: number,
	entitiesBeforeAction: Map<number, Entity>,
	history: readonly HistoryItem[]
  ): Action[] {
	return [
		FatigueDamageAction.create(
		{
			timestamp: item.timestamp,
			index: item.index,
			controller: item.tag.entity,
			amount: item.tag.value
		},
		this.allCards
		)
	];
  }

  public reduce(actions: readonly Action[]): readonly Action[] {
	return actions;
  }
}

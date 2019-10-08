import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { Action } from '../../models/action/action';
import { OptionsAction } from '../../models/action/options-action';
import { Entity } from '../../models/game/entity';
import { HistoryItem } from '../../models/history/history-item';
import { OptionsHistoryItem } from '../../models/history/options-history-item';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class OptionsParser implements Parser {
  constructor(private allCards: AllCardsService, private logger: NGXLogger) {}

  public applies(item: HistoryItem): boolean {
    return item instanceof OptionsHistoryItem;
  }

  public parse(
    item: OptionsHistoryItem,
    currentTurn: number,
    entitiesBeforeAction: Map<number, Entity>,
    history: readonly HistoryItem[]
  ): Action[] {
    return [
      OptionsAction.create(
        {
          timestamp: item.timestamp,
          index: item.index,
          options: item.tag.options
            .filter(option => !option.error || option.error === -1)
            .map(option => option.entity)
        },
        this.allCards
      )
    ];
  }

  public reduce(actions: readonly Action[]): readonly Action[] {
    return ActionHelper.combineActions<Action>(
      actions,
      (previous, current) => this.shouldMergeActions(previous, current),
      (previous, current) => this.mergeActions(previous, current)
    );
  }

  private shouldMergeActions(
    previousAction: Action,
    currentAction: Action
  ): boolean {
    return currentAction instanceof OptionsAction;
  }

  private mergeActions(previousAction: Action, currentAction: Action): Action {
    return previousAction.updateAction({
      index: currentAction.index,
      entities: currentAction.entities,
      options: [
        ...(previousAction.options || []),
        ...(currentAction.options || [])
      ] as readonly number[]
    } as Action);
  }
}

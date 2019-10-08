import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { Action } from '../../models/action/action';
import { EndGameAction } from '../../models/action/end-game-action';
import { GameTag } from '../../models/enums/game-tags';
import { PlayState } from '../../models/enums/playstate';
import { Entity } from '../../models/game/entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class EndGameParser implements Parser {
  constructor(private logger: NGXLogger) {}

  public applies(item: HistoryItem): boolean {
    return (
      item instanceof TagChangeHistoryItem &&
      item.tag.tag === GameTag.PLAYSTATE &&
      [
        PlayState.LOST,
        PlayState.WON,
        PlayState.TIED,
        PlayState.CONCEDED
      ].indexOf(item.tag.value) !== -1
    );
  }

  public parse(
    item: TagChangeHistoryItem,
    currentTurn: number,
    entitiesBeforeAction: Map<number, Entity>,
    history: readonly HistoryItem[],
    players: readonly PlayerEntity[]
  ): Action[] {
    return [
      EndGameAction.create({
        timestamp: item.timestamp,
        index: item.index,
        entityId: players[0].id,
        opponentId: players[1].id,
        winStatus: [[item.tag.entity, item.tag.value]]
      })
    ];
  }

  public reduce(actions: readonly Action[]): readonly Action[] {
    return ActionHelper.combineActions<EndGameAction>(
      actions,
      (previous, current) => this.shouldMergeActions(previous, current),
      (previous, current) => this.mergeActions(previous, current)
    );
  }

  private shouldMergeActions(previous: Action, current: Action): boolean {
    // Absorbs all actions after the end game
    return previous instanceof EndGameAction;
  }

  private mergeActions(
    previousAction: EndGameAction,
    currentAction: EndGameAction
  ): EndGameAction {
    const winStatus: readonly [number, number][] = [
      ...(previousAction.winStatus || []),
      ...(currentAction.winStatus || [])
    ];
    return previousAction.updateAction<EndGameAction>({
      winStatus
    } as EndGameAction);
  }
}

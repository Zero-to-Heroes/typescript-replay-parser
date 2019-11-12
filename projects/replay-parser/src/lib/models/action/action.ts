import { PlayState } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Entity } from '../game/entity';

export abstract class Action {
	readonly timestamp: number;
	readonly index: number;
	readonly textRaw: string;

	// Since we want to make actions more compact and show everything at once, we store
	// this data in possibly any action
	readonly targetIds: readonly number[];

	// Game state information
	readonly entities: Map<number, Entity>;
	readonly crossedEntities: readonly number[] = [];
	readonly highlightedEntities: readonly number[];
	readonly activeSpell: number;
	readonly activePlayer: number;
	readonly isMulligan: boolean;
	readonly isHeroSelection: boolean;
	readonly isEndGame: boolean;
	readonly endGameStatus: PlayState;
	readonly targets: readonly [number, number][];
	readonly options: readonly number[] = [];
	// This is part of the global action, because damage actions can be merged
	// into non-damage ones
	readonly damages: Map<number, number> = Map.of();

	protected abstract getInstance(): Action;
	abstract update(entities: Map<number, Entity>): Action;
	abstract enrichWithText(): Action;

	public updateAction<T extends Action>(newAction: T): T {
		return Object.assign(this.getInstance(), this, newAction);
	}
}

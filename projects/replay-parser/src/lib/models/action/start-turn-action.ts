import { Map } from 'immutable';
import { Entity } from '../game/entity';
import { Action } from './action';

export class StartTurnAction extends Action {
	readonly turn: number;
	readonly isStartOfMulligan: boolean;

	public static create(newAction): StartTurnAction {
		return Object.assign(new StartTurnAction(), newAction);
	}

	public update(entities: Map<number, Entity>): StartTurnAction {
		return Object.assign(new StartTurnAction(), this, { entities });
	}

	public enrichWithText(): StartTurnAction {
		console.log('is hero selection.', this.isHeroSelection);
		const textRaw = this.isHeroSelection
			? 'Hero selection'
			: this.isMulligan
			? 'Start of mulligan'
			: 'Start of turn ' + this.turn;
		return Object.assign(new StartTurnAction(), this, { textRaw });
	}

	protected getInstance(): Action {
		return new StartTurnAction();
	}
}

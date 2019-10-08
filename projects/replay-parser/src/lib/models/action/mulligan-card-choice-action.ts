import { Action } from './action';
import { Map } from 'immutable';
import { Entity } from '../game/entity';
import { AllCardsService } from '../../services/all-cards.service';

export class MulliganCardChoiceAction extends Action {
	readonly playerMulligan: readonly number[];
	readonly opponentMulligan: readonly number[];

	readonly allCards: AllCardsService;

	constructor(allCards: AllCardsService) {
		super();
		this.allCards = allCards;
	}

	public static create(newAction, allCards: AllCardsService): MulliganCardChoiceAction {
		return Object.assign(new MulliganCardChoiceAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): MulliganCardChoiceAction {
		return Object.assign(new MulliganCardChoiceAction(this.allCards), this, { entities });
	}

	public enrichWithText(): MulliganCardChoiceAction {
		const textRaw = '';
		return Object.assign(new MulliganCardChoiceAction(this.allCards), this, { textRaw });
	}

	protected getInstance(): Action {
		return new MulliganCardChoiceAction(this.allCards);
	}
}

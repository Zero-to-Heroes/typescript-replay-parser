import { Map } from 'immutable';
import uniq from 'lodash-es/uniq';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class MulliganCardAction extends Action {
	readonly playerMulligan: readonly number[];
	readonly opponentMulligan: readonly number[];

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): MulliganCardAction {
		return Object.assign(new MulliganCardAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): MulliganCardAction {
		return Object.assign(new MulliganCardAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(): MulliganCardAction {
		const textRaw =
			this.buildMulliganText(this.playerMulligan) + '\n' + this.buildMulliganText(this.opponentMulligan);
		return Object.assign(new MulliganCardAction(this.allCards), this, {
			textRaw,
		});
	}

	private buildMulliganText(cards: readonly number[]): string {
		if (!cards || cards.length === 0) {
			return '';
		}
		const ownerNames: string[] = uniq(
			cards
				.map(entityId => ActionHelper.getOwner(this.entities, entityId))
				.map(playerEntity => playerEntity.name),
		);
		if (ownerNames.length !== 1) {
			console.warn('Invalid grouping of cards ' + ownerNames + ', ' + cards);
			return '';
		}
		const ownerName = ownerNames[0];
		const mulliganedCards = cards
			.map(entityId => ActionHelper.getCardId(this.entities, entityId))
			.map(cardId => this.allCards.getCard(cardId));
		let mulliganInfo = '';
		// We don't have the mulligan info, so we just display the amount of cards being mulliganed
		if (mulliganedCards.some(card => !card || !card.name)) {
			mulliganInfo = `${mulliganedCards.length} cards`;
		} else {
			mulliganInfo = mulliganedCards.map(card => card.name).join(', ');
		}
		const textRaw = `\t${ownerName} mulligans ${mulliganInfo}`;
		return textRaw;
	}

	protected getInstance(): Action {
		return new MulliganCardAction(this.allCards);
	}
}

import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class CardPlayedFromHandAction extends Action {
	readonly entityId: number;

	readonly allCards: AllCardsService;

	constructor(allCards: AllCardsService) {
		super();
		this.allCards = allCards;
	}

	public static create(newAction, allCards: AllCardsService): CardPlayedFromHandAction {
		return Object.assign(new CardPlayedFromHandAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): CardPlayedFromHandAction {
		return Object.assign(new CardPlayedFromHandAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(): CardPlayedFromHandAction {
		const ownerName: string = ActionHelper.getOwner(this.entities, this.entityId).name;
		const cardEntity = this.entities.get(this.entityId);
		const cardId: string = ActionHelper.getCardId(this.entities, this.entityId);
		const card = this.allCards.getCard(cardId);
		const cardName = card ? card.name : 'one card';
		let playVerb = 'plays';
		if (cardEntity.getTag(GameTag.CARDTYPE) === CardType.WEAPON) {
			playVerb = 'equips';
		}
		const textRaw = `\t${ownerName} ${playVerb} ${cardName}`;
		return Object.assign(new CardPlayedFromHandAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new CardPlayedFromHandAction(this.allCards);
	}
}

import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class HeroPowerUsedAction extends Action {
  readonly entityId: number;

  readonly allCards: AllCardsService;

  constructor(allCards: AllCardsService) {
	super();
	this.allCards = allCards;
  }

  public static create(
	newAction,
	allCards: AllCardsService
  ): HeroPowerUsedAction {
	return Object.assign(new HeroPowerUsedAction(allCards), newAction);
  }

  public update(entities: Map<number, Entity>): HeroPowerUsedAction {
	return Object.assign(new HeroPowerUsedAction(this.allCards), this, {
		entities
	});
  }

  public enrichWithText(): HeroPowerUsedAction {
	const ownerName: string = ActionHelper.getOwner(
		this.entities,
		this.entityId
	).name;
	const cardId: string = ActionHelper.getCardId(this.entities, this.entityId);
	const card = this.allCards.getCard(cardId);
	const textRaw = `\t${ownerName} uses ${card.name}`;
	return Object.assign(new HeroPowerUsedAction(this.allCards), this, {
		textRaw
	});
  }

  protected getInstance(): Action {
	return new HeroPowerUsedAction(this.allCards);
  }
}

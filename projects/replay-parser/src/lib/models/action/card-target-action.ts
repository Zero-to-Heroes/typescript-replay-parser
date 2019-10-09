import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';
import { HasTargets } from './has-targets';

export class CardTargetAction extends Action implements HasTargets {
  readonly originId: number;
  readonly targetIds: readonly number[];

  readonly allCards: AllCardsService;

  constructor(allCards: AllCardsService) {
	super();
	this.allCards = allCards;
  }

  public static create(newAction, allCards: AllCardsService): CardTargetAction {
	return Object.assign(new CardTargetAction(allCards), newAction);
  }

  public update(entities: Map<number, Entity>): CardTargetAction {
	return Object.assign(new CardTargetAction(this.allCards), this, {
		entities
	});
  }

  public enrichWithText(): CardTargetAction {
	const originCardId = ActionHelper.getCardId(this.entities, this.originId);
	const targetCardIds = this.targetIds.map(entityId =>
		ActionHelper.getCardId(this.entities, entityId)
	);
	const originCardName = this.allCards.getCard(originCardId).name;
	const targetCardNames = targetCardIds
		.map(cardId => this.allCards.getCard(cardId))
		.map(card => card.name)
		.join(', ');
	const textRaw = `\t${originCardName} targets ${targetCardNames}`;
	return Object.assign(new CardTargetAction(this.allCards), this, {
		textRaw
	});
  }

  protected getInstance(): Action {
	return new CardTargetAction(this.allCards);
  }
}

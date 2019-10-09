import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class DamageAction extends Action {
  constructor(private allCards: AllCardsService) {
	super();
  }

  public static create(newAction, allCards: AllCardsService): DamageAction {
	return Object.assign(new DamageAction(allCards), newAction);
  }

  public update(entities: Map<number, Entity>): DamageAction {
	return Object.assign(new DamageAction(this.allCards), this, {
		entities
	});
  }

  public enrichWithText(): DamageAction {
	const textRaw =
		'\t' +
		this.damages
		.map((amount, entityId) => {
			const entityCardId = ActionHelper.getCardId(this.entities, entityId);
			const entityCard = this.allCards.getCard(entityCardId);
			return `${entityCard.name} takes ${amount} damage`;
		})
		.join(', ');
	return Object.assign(new DamageAction(this.allCards), this, {
		textRaw
	});
  }

  protected getInstance(): Action {
	return new DamageAction(this.allCards);
  }
}

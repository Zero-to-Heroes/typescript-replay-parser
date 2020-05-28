import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardClass, CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-frame',
	styleUrls: ['./card-frame.component.scss'],
	template: `
		<img src="{{ image }}" class="card-frame" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFrameComponent {
	image: string;

	private _cardId: string;
	private _premium: boolean = undefined;

	constructor(private cards: AllCardsService) {}

	@Input('cardId') set cardId(cardId: string) {
		// console.log('[card-frame] setting cardId', cardId);
		this._cardId = cardId;
		this.updateImage();
	}

	@Input('premium') set premium(premium: boolean) {
		// console.log('[card-frame] setting premium', premium);
		this._premium = premium || undefined;
		this.updateImage();
	}

	private updateImage() {
		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);
		const cardClass: CardClass = this.buildPlayerClass(originalCard);
		const cardType: CardType =
			originalCard && originalCard.type ? CardType[originalCard.type.toUpperCase() as string] : undefined;
		const frame: string = this.buildFrame(cardClass, cardType, this._premium);
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/${frame}.png`;
	}

	private buildPlayerClass(originalCard): CardClass {
		const cardClass: CardClass =
			originalCard && originalCard.playerClass
				? CardClass[originalCard.playerClass.toUpperCase() as string]
				: undefined;
		// Ysera
		return cardClass === CardClass.DREAM ? CardClass.HUNTER : cardClass;
	}

	private buildFrame(cardClass: CardClass, cardType: CardType, premium: boolean): string {
		const strClass =
			cardType === CardType.HERO_POWER ? '' : premium ? '-premium' : '-' + CardClass[cardClass]?.toLowerCase();
		if (!CardType[cardType]) {
			console.warn('unknown card type', cardType)
		}
		return `frame-${CardType[cardType]?.toLowerCase()}${strClass}`;
	}
}

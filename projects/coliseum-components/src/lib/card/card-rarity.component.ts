import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardRarity } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-rarity',
	styleUrls: ['./card-rarity.component.scss'],
	template: `
		<img *ngIf="image" src="{{ image }}" class="card-rarity" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardRarityComponent {
	image: string;

	constructor(private cards: AllCardsService) {}

	@Input('cardId') set cardId(cardId: string) {
		// console.log('[card-rarity] setting cardId', cardId);
		this.image = undefined;
		const originalCard = this.cards.getCard(cardId);
		const cardRarity: CardRarity = this.buildRarity(originalCard);
		if (!cardRarity || cardRarity === CardRarity.FREE) {
			return;
		}
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/rarity-${CardRarity[
			cardRarity
		]?.toLowerCase()}.png`;
	}

	private buildRarity(originalCard): CardRarity {
		if (!originalCard.rarity) {
			return undefined;
		}
		return CardRarity[originalCard.rarity.toUpperCase() as string];
	}
}

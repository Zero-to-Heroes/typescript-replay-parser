import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'hero-power-art',
	styleUrls: ['./hero-power-art.component.scss'],
	template: `
		<img src="{{ image }}" class="hero-power-art" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPowerArtComponent {
	image: string;

	constructor() {}

	@Input('cardId') set cardId(cardId: string) {
		// console.log('[hero-power-art] setting cardId', cardId);
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

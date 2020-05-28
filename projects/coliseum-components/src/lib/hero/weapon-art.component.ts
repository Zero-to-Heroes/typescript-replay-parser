import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'weapon-art',
	styleUrls: ['./weapon-art.component.scss'],
	template: `
		<img src="{{ image }}" class="weapon-art" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponArtComponent {
	image: string;

	constructor() {}

	@Input('cardId') set cardId(cardId: string) {
		// console.log('[weapon-art] setting cardId', cardId);
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

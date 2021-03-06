import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'power-indicator',
	styleUrls: ['../global/text.scss', './power-indicator.component.scss'],
	template: `
		<div class="power-indicator {{ effect }}" *ngIf="effect">
			<img class="icon" src="{{ effectImage }}" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerIndicatorComponent {
	effect: string;
	effectImage: string;

	constructor() {}

	@Input('entity') set entity(value: Entity) {
		// console.log('[power-indicator] setting entity', value);
		let image = '';
		this.effect = undefined;
		if (!value) {
			this.effectImage = null;
			return;
		}
		if (value.getTag(GameTag.POISONOUS) === 1) {
			this.effect = 'poisonous';
			image = 'icon_poisonous';
		} else if (value.getTag(GameTag.LIFESTEAL) === 1) {
			this.effect = 'lifesteal';
			image = 'icon_lifesteal';
		} else if (value.getTag(GameTag.DEATHRATTLE) === 1) {
			this.effect = 'deathrattle';
			image = 'icon_deathrattle';
		} else if (value.getTag(GameTag.INSPIRE) === 1) {
			this.effect = 'inspire';
			image = 'icon_inspire';
		} else if (value.getTag(GameTag.TRIGGER_VISUAL) === 1) {
			this.effect = 'trigger';
			image = 'icon_trigger';
		}
		this.effectImage = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/effects/${image}.png`;
	}
}

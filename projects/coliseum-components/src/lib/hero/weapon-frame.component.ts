import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'weapon-frame',
	styleUrls: ['./weapon-frame.component.scss'],
	template: `
		<img src="{{ image }}" class="weapon-frame" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponFrameComponent {
	image: string;

	constructor() {}

	@Input('exhausted') set exhausted(value: boolean) {
		// console.log('[weapon-frame] setting exhausted', value);
		this.image = value
			? `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/weapon_sheathed.png`
			: `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/weapon_unsheathed.png`;
	}
}

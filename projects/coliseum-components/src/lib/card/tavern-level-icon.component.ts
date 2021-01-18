import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'tavern-level-icon',
	styleUrls: ['./tavern-level-icon.component.scss'],
	template: `
		<div class="tavern-level-icon">
			<img class="banner" [src]="image" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernLevelIconComponent {
	image: string;

	@Input() set level(value: number) {
		this.image = value 
		? `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_banner_${value}.png` 
		: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_banner_0.png';
		console.debug('set image', value, this.image)
		
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {
		cdr.detach();
	}
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'board-card-frame',
	styleUrls: ['./board-card-frame.component.scss'],
	template: `
		<div class="board-card-frame" [ngClass]="{ 'premium': _premium }">
			<img src="{{ imageTaunt }}" class="card-frame taunt" *ngIf="imageTaunt" />
			<img src="{{ image }}" class="card-frame" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardFrameComponent {
	image: string;
	imageTaunt: string;
	_premium: boolean = undefined;

	private _taunt: boolean;
	private _hideStats: boolean;

	constructor(private cards: AllCardsService) {}

	@Input('taunt') set taunt(taunt: boolean) {
		// console.log('[board-card-frame] setting taunt', taunt);
		this._taunt = taunt;
		this.updateImageTaunt();
	}

	@Input('premium') set premium(premium: boolean) {
		// console.log('[board-card-frame] setting premium', premium);
		this._premium = premium;
		this.updateImage();
		this.updateImageTaunt();
	}

	@Input('hideStats') set hideStats(value: boolean) {
		// console.log('[board-card-frame] setting hideStats', value);
		this._hideStats = value;
		this.updateImage();
	}

	private updateImage() {
		const frame = this._hideStats ? 'onboard_minion_hide_stats' : 'onboard_minion_frame';
		const premiumFrame = this._premium ? `${frame}_premium` : frame;
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/${premiumFrame}.png`;
	}

	private updateImageTaunt() {
		if (!this._taunt) {
			this.imageTaunt = undefined;
			return;
		}
		const frame = this._premium ? `onboard_minion_taunt_premium` : 'onboard_minion_taunt';
		this.imageTaunt = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/${frame}.png`;
	}
}

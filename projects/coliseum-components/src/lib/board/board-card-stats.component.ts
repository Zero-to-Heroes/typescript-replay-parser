import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'board-card-stats',
	styleUrls: ['../global/text.scss', './board-card-stats.component.scss', '../card/card-stats-colors.scss'],
	template: `
		<div class="card-stats" *ngIf="hasStats">
			<div class="stat {{ attackClass }}">
				<div class="stat-value">
					<svg viewBox="0 0 20 20" *ngIf="useSvg">
						<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{{ _attack }}</text>
					</svg>
					<span class="value" *ngIf="!useSvg">{{ _attack }}</span>
				</div>
			</div>
			<div class="stat {{ healthClass }}">
				<div class="stat-value">
					<svg viewBox="0 0 20 20" *ngIf="useSvg">
						<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{{ healthLeft }}</text>
					</svg>
					<span class="value" *ngIf="!useSvg">{{ healthLeft }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardStatsComponent {
	@Input() useSvg: boolean;

	@Input('cardId') set cardId(cardId: string) {
		// console.log('[board-card-stats] setting cardId', cardId);
		this._cardId = cardId;
		this.updateStats();
	}

	@Input('attack') set attack(attack: number) {
		// console.log('[board-card-stats] setting attack', attack);
		this._attack = attack;
		this.updateStats();
	}

	@Input('health') set health(health: number) {
		// console.log('[board-card-stats] setting health', health);
		this._health = health;
		this.updateStats();
	}

	@Input('damage') set damage(damage: number) {
		// console.log('[board-card-stats] setting damage', damage);
		this._damage = damage;
		this.updateStats();
	}

	hasStats: boolean;

	attackClass: string;
	healthClass: string;
	healthLeft: number;

	_attack: number;

	private _cardId: string;
	private _health: number;
	private _damage: number;

	constructor(
		private cards: AllCardsService,
		private cdr: ChangeDetectorRef,
		private elRef: ElementRef,
		
	) {}

	private updateStats() {
		this.attackClass = undefined;
		this.healthClass = undefined;
		this.hasStats = undefined;

		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);

		if (this._attack == null) {
			this._attack = originalCard.attack;
		}
		if (this._health == null) {
			this._health = originalCard.health;
		}
		if (this._damage == null) {
			this._damage = 0;
		}
		this.hasStats =
			(originalCard.attack || originalCard.health || originalCard.durability || originalCard.armor) > 0;

		this.healthLeft = this._health - this._damage;
		this.updateAttackClass(originalCard);
		this.updateHealthClass(originalCard);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateAttackClass(originalCard) {
		this.attackClass = 'attack';
		if (this._attack > originalCard.attack) {
			this.attackClass += ' buff';
		} else if (this._attack < originalCard.attack) {
			this.attackClass += ' debuff';
		}
	}

	private updateHealthClass(originalCard) {
		this.healthClass = 'health';
		if (this.healthLeft > originalCard.health) {
			this.healthClass += ' buff';
		}
		if (this._damage > 0) {
			this.healthClass += ' damaged';
		}
	}

	private resizeText() {
		const el = this.elRef.nativeElement.querySelector('.card-stats');
		if (!el) {
			setTimeout(() => this.resizeText());
			return;
		}
		const fontSize = 0.2 * el.getBoundingClientRect().width;
		const textEl = this.elRef.nativeElement.querySelector('.card-stats');
		textEl.style.fontSize = fontSize + 'px';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

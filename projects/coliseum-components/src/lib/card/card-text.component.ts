import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardType, GameTag } from '@firestone-hs/reference-data';
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-text',
	styleUrls: ['../global/text.scss', './card-text.component.scss'],
	template: `
		<div class="card-text {{ _cardType }}" [ngClass]="{ 'premium': premium }" *ngIf="text">
			<div
				class="text"
				[fittext]="true"
				[minFontSize]="2"
				[useMaxFontSize]="true"
				[activateOnResize]="false"
				[modelToWatch]="dirtyFlag"
				[innerHTML]="text"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTextComponent {
	_cardType: string;
	premium: boolean;
	text: SafeHtml;
	maxFontSize: number;
	dirtyFlag = false;

	private _entity: Entity;
	private _controller: Entity;

	constructor(
		private cards: AllCardsService,
		private domSanitizer: DomSanitizer,
		
		private cdr: ChangeDetectorRef,
	) {
		document.addEventListener('card-resize', event => this.resizeText());
	}

	@Input('entity') set entity(value: Entity) {
		// console.log('[card-text] setting entity', value.tags.toJS());
		this._entity = value;
		this.updateText();
	}

	@Input('controller') set controller(value: Entity) {
		// console.log('[card-text] setting controller', value && value.tags.toJS());
		this._controller = value;
		this.updateText();
	}

	private updateText() {
		if (!this._entity) {
			return;
		}
		// console.log('updating text')
		const cardId = this._entity.cardID;
		this.text = undefined;
		const originalCard = this.cards.getCard(cardId);
		if (!originalCard.text) {
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		// There are a few cards whose text is truncated in the json cards export
		let description: string = (originalCard.text || '')
			.replace('\n', '<br/>')
			.replace(/\u00a0/g, ' ')
			.replace(/^\[x\]/, '');
		// E.g. Fatespinner
		if (this._entity.getTag(GameTag.HIDDEN_CHOICE) && description.indexOf('@') !== -1) {
			// console.log('hidden choice', this._entity.tags.toJS(), description);
			description = description.split('@')[this._entity.getTag(GameTag.HIDDEN_CHOICE)];
		}
		// Damage placeholder, influenced by spell damage
		let damageBonus = 0;
		let doubleDamage = 0;
		if (this._controller) {
			if (this._entity.getCardType() === CardType.SPELL) {
				damageBonus = this._controller.getTag(GameTag.CURRENT_SPELLPOWER) || 0;
				if (this._entity.getTag(GameTag.RECEIVES_DOUBLE_SPELLDAMAGE_BONUS) === 1) {
					damageBonus *= 2;
				}
				doubleDamage = this._controller.getTag(GameTag.SPELLPOWER_DOUBLE) || 0;
			} else if (this._entity.getCardType() === CardType.HERO_POWER) {
				damageBonus = this._controller.getTag(GameTag.CURRENT_HEROPOWER_DAMAGE_BONUS) || 0;
				doubleDamage = this._controller.getTag(GameTag.HERO_POWER_DOUBLE) || 0;
			}
		}

		description = description
			// Now replace the value, if relevant
			.replace('@', `${this._entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_1)}`)
			.replace(/\$(\d+)/g, this.modifier(damageBonus, doubleDamage))
			.replace(/\#(\d+)/g, this.modifier(damageBonus, doubleDamage));
		this.text = this.domSanitizer.bypassSecurityTrustHtml(description);
		// console.log('updated text', this.text)

		// Text is not the same color for premium cards
		this.premium = this._entity.getTag(GameTag.PREMIUM) === 1;
		this.resizeText();
		setTimeout(() => this.resizeText(), 100);
	}

	@Input('cardType') set cardType(cardType: CardType) {
		// console.log('[card-text] setting cardType', cardType);
		this._cardType = CardType[cardType]?.toLowerCase();
	}

	private resizeText() {
		this.dirtyFlag = !this.dirtyFlag;
		// console.log('asking for text resize')
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private modifier(bonus: number, double: number) {
		return (match, part1) => {
			let value = +part1;
			if (bonus !== 0 || double !== 0) {
				value += bonus;
				value *= Math.pow(2, double);
				// console.log('updated value', value);
				return '*' + value + '*';
			}
			return '' + value;
		};
	}
}

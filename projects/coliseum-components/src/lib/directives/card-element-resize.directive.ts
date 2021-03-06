import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Input, ViewRef } from '@angular/core';

@Directive({
	selector: '[cardElementResize]',
})
export class CardElementResizeDirective implements AfterViewInit {
	@Input() fontSizeRatio: number;
	@Input() timeout = 100;
	@Input() keepOpacity = false;
	@Input() isCardElement = true;
	@Input() cardElementResize: boolean;

	constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {
		document.addEventListener('card-resize', () => this.resizeText());
	}

	ngAfterViewInit() {
		if (this.cardElementResize === false) {
			return;
		}

		this.elRef.nativeElement.style.opacity = 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		if (!this.isCardElement) {
			window.addEventListener('resize', () => this.resizeText());
		}
		setTimeout(() => this.resizeText(), this.timeout);
	}

	private resizeText() {
		if (this.cardElementResize === false) {
			return;
		}

		const el = this.elRef.nativeElement;
		if (!el) {
			setTimeout(() => this.resizeText(), 20);
			return;
		}
		const fontSize = this.fontSizeRatio * el.getBoundingClientRect().width;
		const textEls = this.elRef.nativeElement.querySelectorAll('[resizeTarget]');
		// console.log('fontSize', fontSize, textEls)
		for (const textEl of textEls) {
			textEl.style.fontSize = fontSize + 'px';
			// console.log('resized element', textEl, textEls);
			if (!this.keepOpacity) {
				this.elRef.nativeElement.style.opacity = 1;
			} else {
				this.elRef.nativeElement.style.removeProperty('opacity');
			}
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}
}

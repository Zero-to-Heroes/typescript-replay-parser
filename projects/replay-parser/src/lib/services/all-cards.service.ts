import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ReferenceCard } from '../models/reference-cards/reference-card';

const CARDS_CDN_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/cards.json?v=2';

@Injectable({
	providedIn: 'root',
})
export class AllCardsService {
	private allCards: ReferenceCard[];
	private cache: any = {};

	constructor(private http: HttpClient, private logger: NGXLogger) {
		// We don't call it in the constructor because we want the app to be in control
		// of how they load the cards, and for it to be aware of when cards have been loaded
		// this.retrieveAllCards();
	}

	// We keep this synchronous because we ensure, in the game init pipeline, that loading cards
	// is the first thing we do
	public getCard(id: string): ReferenceCard {
		if (this.cache[id]) {
			return this.cache[id];
		}
		if (!this.allCards) {
			this.logger.debug('getCard', 'cards not initialized yet', id);
			return {} as ReferenceCard;
		}
		const candidates = this.allCards.filter(card => card.id === id);
		if (!candidates || candidates.length === 0) {
			this.logger.debug('Could not find card for id', id);
			return {} as ReferenceCard;
		}
		if (candidates.length === 1) {
			this.cache[id] = candidates[0];
		}
		return candidates[0];
	}

	public getCardFromDbfId(dbfId: number): ReferenceCard {
		if (!this.allCards) {
			this.logger.debug('getCardFromDbfId', 'cards not initialized yet', dbfId);
			return {} as ReferenceCard;
		}
		return this.allCards.find(card => card.dbfId === dbfId);
	}

	public getCardsFromDbfIds(dbfIds: number[]): ReferenceCard[] {
		if (!this.allCards) {
			this.logger.debug('getCardsFromDbfIds', 'cards not initialized yet', dbfIds);
			return [];
		}
		return this.allCards.filter(card => dbfIds.indexOf(card.dbfId) !== -1);
	}

	public getCards(): ReferenceCard[] {
		return this.allCards;
	}

	public async initializeCardsDb(): Promise<void> {
		// this.logger.debug('[all-cards] initializing card db');
		return new Promise<void>((resolve, reject) => {
			if (this.allCards) {
				// this.logger.debug('[all-cards] already loaded all cards');
				resolve();
				return;
			}
			this.cache = {};
			// this.logger.debug('[all-cards] retrieving local cards');
			this.http
				.get('./cards.json')
				.pipe(
					timeout(200),
					catchError((error, caught) => {
						// this.logger.debug('[all-cards] Could not retrieve cards locally, getting them from CDN', error);
						this.http.get(CARDS_CDN_URL).subscribe(
							(result: any[]) => {
								// this.logger.debug('[all-cards] retrieved all cards from CDN');
								this.allCards = result;
								for (const card of this.allCards) {
									if (card.id) {
										this.cache[card.id] = card;
									}
								}
								resolve();
								return of(null);
							},
							error => {
								this.logger.debug('[all-cards] Could not retrieve cards from CDN', error);
								return of(null);
							},
						);
						return of(null);
					}),
				)
				.subscribe(
					(result: any[]) => {
						if (result) {
							// this.logger.debug('[all-cards] retrieved all cards locally');
							this.allCards = result;
							for (const card of this.allCards) {
								if (card.id) {
									this.cache[card.id] = card;
								}
							}
							resolve();
						}
					},
					error => {},
				);
		});
	}
}

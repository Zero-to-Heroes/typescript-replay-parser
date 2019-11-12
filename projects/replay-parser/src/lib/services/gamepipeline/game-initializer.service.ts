import { Injectable } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Entity } from '../../models/game/entity';
import { Game } from '../../models/game/game';
import { GameHepler } from '../../models/game/game-helper';
import { PlayerEntity } from '../../models/game/player-entity';
import { HistoryItem } from '../../models/history/history-item';

@Injectable({
	providedIn: 'root',
})
export class GameInitializerService {
	public initializeGameWithPlayers(history: readonly HistoryItem[], entities: Map<number, Entity>): Game {
		const players: PlayerEntity[] = entities
			.filter((entity: Entity) => entity.getCardType() === CardType.PLAYER)
			.map(entity => entity as PlayerEntity)
			.toArray();
		let player1 = players[0];
		let player2 = players[1];
		const firstPlayerHand: readonly Entity[] = GameHepler.getPlayerHand(entities, players[0].playerId);
		if (
			// All game modes known today have the main player have at least 3 cards in hand
			firstPlayerHand.length < 3 ||
			!firstPlayerHand[0].isRevealed() ||
			!firstPlayerHand[1].isRevealed() ||
			!firstPlayerHand[2].isRevealed()
		) {
			[player1, player2] = [player2, player1];
		}

		// AI trick
		if (player1.accountHi === '0' && player1.accountLo === '0') {
			[player1, player2] = [player2, player1];
		}
		const game = Game.createGame({} as Game, {
			entities,
			players: [player1, player2],
		});
		return game;
	}
}

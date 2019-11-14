import { Map } from 'immutable';
import { Entity } from './entity';
import { PlayerEntity } from './player-entity';
import { Turn } from './turn';

export class Game {
	readonly entities: Map<number, Entity> = Map();
	readonly players: readonly PlayerEntity[] = [];
	readonly turns: Map<number, Turn> = Map<number, Turn>();
	readonly fullStoryRaw: string;
	readonly buildNumber: number;
	readonly gameType: number;
	readonly formatType: number;
	readonly scenarioID: number;

	private constructor() {}

	public static createGame(baseGame: Game, newAttributes?: any): Game {
		return Object.assign(new Game(), { ...baseGame }, { ...newAttributes });
	}
}

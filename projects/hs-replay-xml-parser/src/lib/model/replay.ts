import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';

export class Replay {
	readonly replay: ElementTree;
	readonly mainPlayerId: number;
	readonly mainPlayerName: string;
	// readonly mainPlayerClass: string;
	readonly mainPlayerCardId: string;
	readonly opponentPlayerId: number;
	readonly opponentPlayerName: string;
	// readonly opponentPlayerClass: string;
	readonly opponentPlayerCardId: string;
	readonly gameFormat: GameFormat;
	readonly gameType: GameType;
	readonly scenarioId: number;
	readonly result: string;
	readonly additionalResult: string;
	readonly playCoin: string;
}

import { BnetRegion, GameFormat, GameType } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';

export class Replay {
	readonly replay: ElementTree;
	readonly mainPlayerId: number;
	readonly mainPlayerName: string;
	readonly mainPlayerCardId: string;
	readonly opponentPlayerId: number;
	readonly opponentPlayerName: string;
	readonly opponentPlayerCardId: string;
	readonly region: BnetRegion;
	readonly gameFormat: GameFormat;
	readonly gameType: GameType;
	readonly scenarioId: number;
	readonly result: 'won' | 'lost' | 'tied';
	readonly additionalResult: string;
	readonly playCoin: 'play' | 'coin';
}

import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';

export class Replay {
	readonly replay: ElementTree;
	readonly mainPlayerId: number;
	readonly gameFormat: GameFormat;
	readonly gameType: GameType;
	readonly scenarioId: number;
}

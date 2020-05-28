import { BgsBoard, BgsTavernUpgrade, BgsTriple } from '../exrtactors/battlegrounds/battlegrounds-game-extractor';
import { BooleanTurnInfo } from './boolean-turn-info';
import { NumericTurnInfo } from './numeric-turn-info';

export interface BgsPostMatchStats {
	readonly tavernTimings: readonly BgsTavernUpgrade[];
	readonly tripleTimings: readonly BgsTriple[];
	readonly rerolls: number;

	readonly replayLink: string;

	readonly boardHistory: readonly BgsBoard[];
	// readonly compositionsOverTurn: readonly BgsCompositionForTurn[];
	readonly rerollsOverTurn: readonly NumericTurnInfo[];
	readonly freezesOverTurn: readonly NumericTurnInfo[];
	readonly coinsWastedOverTurn: readonly NumericTurnInfo[];
	readonly mainPlayerHeroPowersOverTurn: readonly NumericTurnInfo[];
	readonly hpOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] };
	readonly leaderboardPositionOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] };
	readonly totalStatsOverTurn: readonly NumericTurnInfo[];
	readonly wentFirstInBattleOverTurn: readonly BooleanTurnInfo[];

	readonly minionsBoughtOverTurn: readonly NumericTurnInfo[];
	readonly minionsSoldOverTurn: readonly NumericTurnInfo[];

	readonly totalMinionsDamageDealt: { [cardId: string]: number };
	readonly totalMinionsDamageTaken: { [cardId: string]: number };

	readonly totalEnemyMinionsKilled: number;
	readonly totalEnemyHeroesKilled: number;
	readonly luckFactor: number;
}

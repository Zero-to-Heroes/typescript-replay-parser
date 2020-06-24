import { BattleResultHistory, BgsPlayer } from '../../model/battlegrounds';
import { BgsPostMatchStats } from '../../model/bgs-post-match-stats';
import { Replay } from '../../model/replay';
import { parseHsReplayString } from '../../xml-parser';
import { reparseReplay } from './replay-parser';

export const buildPostMatchStats = (
	replayXml: string,
	mainPlayer: BgsPlayer,
	battleResultHistory: readonly BattleResultHistory[],
): BgsPostMatchStats => {
	const replay: Replay = parseHsReplayString(replayXml);
	console.log('parsed replay', replayXml?.length);
	const player: BgsPlayer = mainPlayer;
	const structure = reparseReplay(replay);
	const winLuckFactor = buildWinLuckFactor(battleResultHistory);
	const tieLuckFactor = buildTieLuckFactor(battleResultHistory);
	const postMatchStats: BgsPostMatchStats = {
		tavernTimings: player.tavernUpgradeHistory,
		tripleTimings: player.tripleHistory, // TODO: add the cards when relevant
		coinsWastedOverTurn: structure.coinsWastedOverTurn,
		rerolls: structure.rerollsOverTurn.map(turnInfo => turnInfo.value).reduce((a, b) => a + b, 0),
		boardHistory: player.boardHistory,
		rerollsOverTurn: structure.rerollsOverTurn,
		freezesOverTurn: structure.freezesOverTurn,
		mainPlayerHeroPowersOverTurn: structure.mainPlayerHeroPowersOverTurn,
		hpOverTurn: structure.hpOverTurn,
		totalStatsOverTurn: structure.totalStatsOverTurn,
		minionsBoughtOverTurn: structure.minionsBoughtOverTurn,
		minionsSoldOverTurn: structure.minionsSoldOverTurn,
		totalMinionsDamageDealt: structure.totalMinionsDamageDealt,
		totalMinionsDamageTaken: structure.totalMinionsDamageTaken,
		totalEnemyMinionsKilled: structure.totalEnemyMinionsKilled,
		totalEnemyHeroesKilled: structure.totalEnemyHeroesKilled,
		wentFirstInBattleOverTurn: structure.wentFirstInBattleOverTurn,
		luckFactor: (2 * winLuckFactor + tieLuckFactor) / 3,
	} as BgsPostMatchStats;
	return postMatchStats;
};

// Returns -1 if had the worst possible luck, and 1 if had the best possible luck
const buildWinLuckFactor = (battleResultHistory: readonly BattleResultHistory[]): number => {
	return spreadAroundZero(
		battleResultHistory
			.filter(history => history.simulationResult) // Mostly for dev, shouldn't happen in real life
			.map(history => {
				const victory = history.actualResult === 'won' ? 1 : 0;
				const chance = history.simulationResult.wonPercent / 100;
				return victory - chance;
			})
			.reduce((a, b) => a + b, 0) / battleResultHistory.length,
	);
};
const buildTieLuckFactor = (battleResultHistory: readonly BattleResultHistory[]): number => {
	return spreadAroundZero(
		battleResultHistory
			.filter(history => history.simulationResult)
			.map(history => {
				const victory = history.actualResult === 'won' || history.actualResult === 'tied' ? 1 : 0;
				const chance = (history.simulationResult.wonPercent + history.simulationResult.tiedPercent) / 100;
				return victory - chance;
			})
			.reduce((a, b) => a + b, 0) / battleResultHistory.length,
	);
};
// Keep the value between -1 and 1 but make it spread more around 0, since the limit cases
// are really rare
const spreadAroundZero = (value: number): number => {
	return Math.sign(value) * Math.pow(Math.abs(value), 0.3);
};

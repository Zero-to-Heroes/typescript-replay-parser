import { allMinionsPlayedExtractor } from './exrtactors/all-minions-played-extractor';
import { totalDamageDealtToEnemyHeroExtractor } from './exrtactors/total-damage-dealt-to-enemy-hero-extractor';
import { totalDurationExtractor } from './exrtactors/total-duration-extractor';
import { killedEnemeyHeroesExtarctor } from './exrtactors/total-enemy-heroes-killed-extractor';
import { totalManaSpentExtractor } from './exrtactors/total-mana-spent-extractor';
import { totalMinionsDeathExtractor } from './exrtactors/total-minions-death-extractor';
import { PlayerOpponentElements } from './model/player-opponent-elements';
import { PlayerOpponentValues } from './model/player-opponent-values';
import { Replay } from './model/replay';
import { buildReplayFromXml } from './replay-parser';

export const parseHsReplayString = (replayString: string): Replay => {
	return buildReplayFromXml(replayString);
};

export const extractTotalManaSpent = (replay: Replay): PlayerOpponentValues => {
	return totalManaSpentExtractor(replay);
};

export const extractTotalDamageDealtToEnemyHero = (replay: Replay): PlayerOpponentValues => {
	return totalDamageDealtToEnemyHeroExtractor(replay);
};

export const extractTotalMinionDeaths = (replay: Replay): PlayerOpponentValues => {
	return totalMinionsDeathExtractor(replay);
};

export const extractTotalDuration = (replay: Replay): number => {
	return totalDurationExtractor(replay);
};

export const extractNumberOfKilledEnemyHeroes = (replay: Replay): number => {
	return killedEnemeyHeroesExtarctor(replay);
};

export const extractAllMinionsPlayed = (replay: Replay): PlayerOpponentElements => {
	return allMinionsPlayedExtractor(replay);
};

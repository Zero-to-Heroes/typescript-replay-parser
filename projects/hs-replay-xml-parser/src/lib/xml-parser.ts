import { CardType, GameTag } from '@firestone-hs/reference-data';
import { parse } from 'elementtree';
import { totalDamageDealtToEnemyHeroExtractor } from './exrtactors/total-damage-dealt-to-enemy-hero-extractor';
import { totalManaSpentExtractor } from './exrtactors/total-mana-spent-extractor';
import { totalMinionsDeathExtractor } from './exrtactors/total-minions-death-extractor';
import { PlayerOpponentValues } from './model/player-opponent-values';
import { Replay } from './model/replay';

export const parseHsReplayString = (replayString: string): Replay => {
	// http://effbot.org/zone/element-xpath.htm
	// http://effbot.org/zone/pythondoc-elementtree-ElementTree.htm
	const elementTree = parse(replayString);
	const mainPlayerId = elementTree
		.findall(`.//ShowEntity`)
		.filter(showEntity => showEntity.get('cardID'))
		.filter(showEntity => {
			const cardTypeTag = showEntity.find(`Tag[@tag='${GameTag.CARDTYPE}']`);
			return !cardTypeTag || parseInt(cardTypeTag.get('value')) !== CardType.ENCHANTMENT;
		})
		.filter(showEntity => showEntity.find(`Tag[@tag='${GameTag.CONTROLLER}']`))
		.map(showEntity => showEntity.find(`Tag[@tag='${GameTag.CONTROLLER}']`))
		.map(tag => parseInt(tag.get('value')))
		.find(controllerId => controllerId);
	const gameFormat = parseInt(elementTree.find('Game').get('formatType'));
	const gameMode = parseInt(elementTree.find('Game').get('gameType'));
	const scenarioId = parseInt(elementTree.find('Game').get('scenarioID'));
	return Object.assign(new Replay(), {
		replay: elementTree,
		mainPlayerId: mainPlayerId,
		gameFormat: gameFormat,
		gameType: gameMode,
		scenarioId: scenarioId,
	} as Replay);
};

export const extractTotalManaSpent = (replay: Replay): PlayerOpponentValues => {
	return totalManaSpentExtractor(replay);
};

export const extractTotalDamageDealtToEnemyHero = (replay: Replay): number => {
	return totalDamageDealtToEnemyHeroExtractor(replay);
};

export const extractTotalMinionDeaths = (replay: Replay): PlayerOpponentValues => {
	return totalMinionsDeathExtractor(replay);
};

import { CardType, GameTag } from '@firestone-hs/reference-data';
import { parse } from 'elementtree';
import { totalDamageDealtToEnemyHeroExtractor } from './exrtactors/total-damage-dealt-to-enemy-hero-extractor';
import { totalDurationExtractor } from './exrtactors/total-duration-extractor';
import { totalManaSpentExtractor } from './exrtactors/total-mana-spent-extractor';
import { totalMinionsDeathExtractor } from './exrtactors/total-minions-death-extractor';
import { PlayerOpponentValues } from './model/player-opponent-values';
import { Replay } from './model/replay';

export const parseHsReplayString = (replayString: string): Replay => {
	// http://effbot.org/zone/element-xpath.htm
	// http://effbot.org/zone/pythondoc-elementtree-ElementTree.htm
	const elementTree = parse(replayString);
	const vsAiTrick = elementTree
		.findall('.//Player')
		.filter(player => parseInt(player.get('accountLo')) !== 0)
		.map(player => parseInt(player.get('playerID')));
	const mainPlayerId =
		vsAiTrick.length === 1
			? vsAiTrick[0]
			: elementTree
					.findall(`.//ShowEntity`)
					.filter(showEntity => showEntity.get('cardID'))
					.filter(showEntity => {
						const cardTypeTag = showEntity.find(`Tag[@tag='${GameTag.CARDTYPE}']`);
						return (
							!cardTypeTag ||
							[CardType.ENCHANTMENT, CardType.HERO, CardType.HERO_POWER].indexOf(
								parseInt(cardTypeTag.get('value')),
							) === -1
						);
					})
					.filter(showEntity => showEntity.find(`Tag[@tag='${GameTag.CONTROLLER}']`))
					.map(showEntity => showEntity.find(`Tag[@tag='${GameTag.CONTROLLER}']`))
					.map(tag => parseInt(tag.get('value')))
					.find(controllerId => controllerId);
	const opponentPlayerId = parseInt(
		elementTree
			.findall('.//Player')
			.find(player => parseInt(player.get('playerID')) !== mainPlayerId)
			.get('playerID'),
	);
	const gameFormat = parseInt(elementTree.find('Game').get('formatType'));
	const gameMode = parseInt(elementTree.find('Game').get('gameType'));
	const scenarioId = parseInt(elementTree.find('Game').get('scenarioID'));
	return Object.assign(new Replay(), {
		replay: elementTree,
		mainPlayerId: mainPlayerId,
		opponentPlayerId: opponentPlayerId,
		gameFormat: gameFormat,
		gameType: gameMode,
		scenarioId: scenarioId,
	} as Replay);
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

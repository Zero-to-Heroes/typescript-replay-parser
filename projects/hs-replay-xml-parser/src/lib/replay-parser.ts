import { BnetRegion, CardType, GameTag, GameType, PlayState } from '@firestone-hs/reference-data';
import bigInt from 'big-integer';
import { Element, ElementTree, parse } from 'elementtree';
import { Replay } from './model/replay';

export const buildReplayFromXml = (replayString: string): Replay => {
	if (!replayString || replayString.length === 0) {
		return null;
	}
	// http://effbot.org/zone/element-xpath.htm
	// http://effbot.org/zone/pythondoc-elementtree-ElementTree.htm
	// console.log('preparing to create element tree');
	const elementTree = parse(replayString);
	// console.log('elementTree');

	const mainPlayerElement =
		elementTree.findall('.//Player').find(player => player.get('isMainPlayer') === 'true') ||
		elementTree.findall('.//Player')[0]; // Should never happen, but a fallback just in case
	const mainPlayerId = parseInt(mainPlayerElement.get('playerID'));
	const mainPlayerName = mainPlayerElement.get('name');
	const mainPlayerEntityId = mainPlayerElement.get('id');
	const mainPlayerCardId = extractPlayerCardId(mainPlayerElement, mainPlayerEntityId, elementTree);
	const region: BnetRegion = bigInt(parseInt(mainPlayerElement.get('accountHi')))
		.shiftRight(32)
		.and(0xff)
		.toJSNumber();
	// console.log('mainPlayer');

	const opponentPlayerElement =
		elementTree.findall('.//Player').find(player => player.get('isMainPlayer') === 'false') ||
		elementTree.findall('.//Player')[1];
	const opponentPlayerId = parseInt(opponentPlayerElement.get('playerID'));
	const opponentPlayerName = opponentPlayerElement.get('name');
	const opponentPlayerEntityId = opponentPlayerElement.get('id');
	const opponentPlayerCardId = extractPlayerCardId(opponentPlayerElement, opponentPlayerEntityId, elementTree);
	// console.log('opponentPlayer');

	const gameFormat = parseInt(elementTree.find('Game').get('formatType'));
	const gameMode = parseInt(elementTree.find('Game').get('gameType'));
	const scenarioId = parseInt(elementTree.find('Game').get('scenarioID'));

	const result = extractResult(mainPlayerEntityId, elementTree);
	// console.log('result');
	const additionalResult =
		gameMode === GameType.GT_BATTLEGROUNDS || gameMode === GameType.GT_BATTLEGROUNDS_FRIENDLY
			? '' + extractBgsAdditionalResult(mainPlayerId, mainPlayerCardId, opponentPlayerId, elementTree)
			: null;
	// console.log('bgsResult');
	const playCoin = extarctPlayCoin(mainPlayerEntityId, elementTree);

	return Object.assign(new Replay(), {
		replay: elementTree,
		mainPlayerId: mainPlayerId,
		mainPlayerName: mainPlayerName,
		mainPlayerCardId: mainPlayerCardId,
		opponentPlayerId: opponentPlayerId,
		opponentPlayerName: opponentPlayerName,
		opponentPlayerCardId: opponentPlayerCardId,
		region: region,
		gameFormat: gameFormat,
		gameType: gameMode,
		scenarioId: scenarioId,
		result: result,
		additionalResult: additionalResult,
		playCoin: playCoin,
	} as Replay);
};

const extractPlayerCardId = (playerElement: Element, playerEntityId: string, elementTree: ElementTree): string => {
	const heroEntityId = playerElement.find(`.//Tag[@tag='${GameTag.HERO_ENTITY}']`).get('value');
	const heroEntity = elementTree.find(`.//FullEntity[@id='${heroEntityId}']`);
	let cardId = heroEntity.get('cardID');
	// Battlegrounds assigns TB_BaconShop_HERO_PH at the start and then changes to the real hero
	if (cardId === 'TB_BaconShop_HERO_PH') {
		const tagChanges = elementTree
			.findall(`.//TagChange[@tag='${GameTag.HERO_ENTITY}'][@entity='${playerEntityId}']`)
			.map(tag => tag.get('value'));
		const pickedPlayedHero = tagChanges && tagChanges.length > 0 ? tagChanges[0] : null;
		const newHero = elementTree.findall(`.//FullEntity[@id='${pickedPlayedHero}']`)[0];
		cardId = newHero.get('cardID');
	}
	return cardId;
};

const extractResult = (mainPlayerEntityId: string, elementTree: ElementTree): string => {
	const winChange = elementTree.find(`.//TagChange[@tag='${GameTag.PLAYSTATE}'][@value='${PlayState.WON}']`);
	if (!winChange) {
		const tieChange = elementTree.find(`.//TagChange[@tag='${GameTag.PLAYSTATE}'][@value='${PlayState.TIED}']`);
		return tieChange ? 'tied' : 'unknown';
	}
	return mainPlayerEntityId === winChange.get('entity') ? 'won' : 'lost';
};

const extarctPlayCoin = (mainPlayerEntityId: string, elementTree: ElementTree): string => {
	const firstPlayerTags = elementTree.findall(`.//TagChange[@tag='${GameTag.FIRST_PLAYER}'][@value='1']`);
	return firstPlayerTags && firstPlayerTags.length > 0 && firstPlayerTags[0].get('entity') === mainPlayerEntityId
		? 'play'
		: 'coin';
};

const extractBgsAdditionalResult = (
	mainPlayerId: number,
	mainPlayerCardId: string,
	opponentPlayerId: number,
	elementTree: ElementTree,
): number => {
	// const playerStats = extractBgsPlayerStats(elementTree, mainPlayerId, opponentPlayerId);
	// const playerStat = playerStats.find(stat => stat.heroCardId === mainPlayerCardId);
	// console.log('extracted battlegrounds additional result', mainPlayerId, mainPlayerCardId, playerStat, playerStats);
	// return playerStat.finalRank;

	const playerEntities = elementTree
		.findall('.//FullEntity')
		.filter(entity => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO}']`))
		.filter(entity => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${mainPlayerId}']`))
		.filter(
			entity =>
				['TB_BaconShop_HERO_PH', 'TB_BaconShop_HERO_KelThuzad', 'TB_BaconShopBob'].indexOf(
					entity.get('cardID'),
				) === -1,
		);
	const entityIds = playerEntities.map(entity => entity.get('id'));
	let leaderboardTags = elementTree
		.findall(`.//TagChange[@tag='${GameTag.PLAYER_LEADERBOARD_PLACE}']`)
		.filter(tag => entityIds.indexOf(tag.get('entity')) !== -1)
		.map(tag => parseInt(tag.get('value')))
		.filter(value => value > 0);
	// No tag change, look at root tag
	if (!leaderboardTags || leaderboardTags.length === 0) {
		leaderboardTags = playerEntities
			.map(entity => entity.find(`.Tag[@tag='${GameTag.PLAYER_LEADERBOARD_PLACE}']`))
			.filter(tag => tag)
			.map(tag => parseInt(tag.get('value')))
			.filter(value => value > 0);
	}
	return !leaderboardTags || leaderboardTags.length === 0 ? 0 : leaderboardTags[leaderboardTags.length - 1];
};

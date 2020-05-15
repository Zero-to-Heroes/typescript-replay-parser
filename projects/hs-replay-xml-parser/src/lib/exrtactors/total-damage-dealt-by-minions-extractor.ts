import { BlockType } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { extractHeroEntityIds } from '../global-info-extractor';
import { extractAllMinions } from '../global-info-extractor-internal';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalDamageDealtByMinionsExtractor = (replay: Replay): PlayerOpponentValues => {
	const allMinions = extractAllMinions(replay);
	const damageByPlayerMinions = buildDamageByMinions(replay, replay.mainPlayerId, allMinions);
	const damageByOpponentMinions = buildDamageByMinions(replay, replay.opponentPlayerId, allMinions);
	return { player: damageByPlayerMinions, opponent: damageByOpponentMinions };
};

const buildDamageByMinions = (replay: Replay, playerId: number, allMinions: readonly Element[]): number => {
	const 
	const playerMinions = allMinions.filter(minion => minion.find('.Tag'))
	const attackBlocks = replay.replay.findall(`.//Block[@type='${BlockType.ATTACK}']`);


	const heroEntityIds = extractHeroEntityIds(replay, playerId);
	const damageTags = replay.replay.findall(`.//MetaData[@meta='1']`);
	damageTags.filter(tag => {
		tag.
	})
	
	const damageToHero: number = damageTags
		.map(tag => {
			const infos = tag
				.findall(`.Info`)
				.filter(info => heroEntityIds.indexOf(parseInt(info.get('entity'))) !== -1);

			if (!infos || infos.length === 0) {
				return 0;
			}
			return parseInt(tag.get('data'));
		})
		.reduce((a, b) => a + b, 0);
	return damageToHero;
};

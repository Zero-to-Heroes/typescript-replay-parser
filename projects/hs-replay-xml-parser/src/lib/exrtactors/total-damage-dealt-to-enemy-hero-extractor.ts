import { GameTag } from '@firestone-hs/reference-data';
import { Replay } from '../model/replay';

export const totalDamageDealtToEnemyHeroExtractor = (replay: Replay): number => {
	const opponentHeroEntityId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
			.find(`.Tag[@tag='${GameTag.HERO_ENTITY}']`)
			.get('value'),
	);
	const damageTags = replay.replay.findall(`.//MetaData[@meta='1']`);
	const damageToOpponentHero: number = damageTags
		.map(tag => {
			const infos = tag.findall(`.Info[@entity='${opponentHeroEntityId}']`);
			if (!infos || infos.length === 0) {
				return 0;
			}
			return parseInt(tag.get('data'));
		})
		.reduce((a, b) => a + b, 0);
	return damageToOpponentHero;
};

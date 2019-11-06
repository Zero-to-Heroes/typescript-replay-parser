import { GameTag } from '@firestone-hs/reference-data';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalDamageDealtToEnemyHeroExtractor = (replay: Replay): PlayerOpponentValues => {
	const damageToMainPlayer = buildDamageToPlayerId(replay, replay.mainPlayerId);
	const damageToOpponentPlayer = buildDamageToPlayerId(replay, replay.opponentPlayerId);
	return { player: damageToMainPlayer, opponent: damageToOpponentPlayer };
};

const buildDamageToPlayerId = (replay: Replay, playerId: number): number => {
	const entityId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) === playerId)
			.get('id'),
	);

	// The entity can change
	const startingHeroEntityId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) === playerId)
			.find(`.Tag[@tag='${GameTag.HERO_ENTITY}']`)
			.get('value'),
	);
	const otherHeroEntityIds: number[] = replay.replay
		.findall(`.//TagChange[@tag='${GameTag.HERO_ENTITY}'][@entity='${entityId}']`)
		.map(tag => parseInt(tag.get('value')));
	const heroEntityIds = [entityId, startingHeroEntityId, ...otherHeroEntityIds];

	const damageTags = replay.replay.findall(`.//MetaData[@meta='1']`);
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

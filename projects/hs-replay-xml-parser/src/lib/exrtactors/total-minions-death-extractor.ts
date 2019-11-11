import { BlockType, GameTag, Zone } from '@firestone-hs/reference-data';
import { extractAllMinions } from '../global-info-extractor-internal';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalMinionsDeathExtractor = (replay: Replay): PlayerOpponentValues => {
	const allMinionEntities = extractAllMinions(replay);

	const allDeadMinionEntityIds = replay.replay
		.findall(`.//Block[@type='${BlockType.DEATHS}']`)
		.map(block => block.findall(`.//TagChange[@tag='${GameTag.ZONE}']`))
		.reduce((a, b) => a.concat(b), [])
		.filter(tag => parseInt(tag.get('value')) === Zone.GRAVEYARD)
		.map(tag => parseInt(tag.get('entity')));

	const playerDeadMinionEntityIds = [
		...new Set(
			allMinionEntities
				.filter(
					entity => allDeadMinionEntityIds.indexOf(parseInt(entity.get('entity') || entity.get('id'))) !== -1,
				)
				.filter(entity => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${replay.mainPlayerId}']`)),
		),
	];
	const opponentPlayerId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
			.get('playerID'),
	);
	const opponentDeadMinionEntityIds = [
		...new Set(
			allMinionEntities
				.filter(
					entity => allDeadMinionEntityIds.indexOf(parseInt(entity.get('entity') || entity.get('id'))) !== -1,
				)
				.filter(entity => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${opponentPlayerId}']`)),
		),
	];

	return { player: playerDeadMinionEntityIds.length, opponent: opponentDeadMinionEntityIds.length };
};

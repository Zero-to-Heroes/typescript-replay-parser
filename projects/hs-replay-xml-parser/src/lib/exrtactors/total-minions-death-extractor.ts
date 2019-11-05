import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalMinionsDeathExtractor = (replay: Replay): PlayerOpponentValues => {
	const allMinionShowEntities = replay.replay
		.findall('.//ShowEntity')
		// Get only the entities that are of MINION type
		.filter(show => show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`));
	const allMinionFullEntities = replay.replay
		// Only the ones that have been revealed
		.findall('.//FullEntity[@cardID]')
		// Get only the entities that are of MINION type
		.filter(show => show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`));
	const allMinionEntities = [...allMinionShowEntities, ...allMinionFullEntities];

	const allDeadMinionEntityIds = replay.replay
		.findall(`.//Block[@type='${BlockType.DEATHS}']`)
		.map(block => block.findall(`.//TagChange[@tag='${GameTag.ZONE}']`))
		.reduce((a, b) => a.concat(b), [])
		.filter(tag => parseInt(tag.get('value')) === Zone.GRAVEYARD)
		.map(tag => parseInt(tag.get('entity')));

	const playerDeadMinionEntityIds = allMinionEntities
		.filter(entity => allDeadMinionEntityIds.indexOf(parseInt(entity.get('entity') || entity.get('id'))) !== -1)
		.filter(entity => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${replay.mainPlayerId}']`));
	const opponentPlayerId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
			.get('playerID'),
	);
	const opponentDeadMinionEntityIds = allMinionEntities
		.filter(entity => allDeadMinionEntityIds.indexOf(parseInt(entity.get('entity') || entity.get('id'))) !== -1)
		.filter(entity => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${opponentPlayerId}']`));

	return { player: playerDeadMinionEntityIds.length, opponent: opponentDeadMinionEntityIds.length };
};

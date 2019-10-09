import { Map } from 'immutable';
import { GameTag } from '../enums/game-tags';
import { Zone } from '../enums/zone';
import { Entity } from './entity';
import { PlayerEntity } from './player-entity';

// Avoid "Lambda not supported" error
// @dynamic
export class GameHepler {
  private constructor() {}

  public static getPlayerHand(
	entities: Map<number, Entity>,
	playerId: number
  ): readonly Entity[] {
	return entities
		.filter(
		(entity: Entity) => entity.getTag(GameTag.CONTROLLER) === playerId
		)
		.filter((entity: Entity) => entity.getTag(GameTag.ZONE) === Zone.HAND)
		.sortBy((entity: Entity) => entity.getTag(GameTag.ZONE_POSITION))
		.toArray();
  }

  public static isPlayerEntity(
	entityId: number,
	entities: Map<number, Entity>
  ) {
	return entities.get(entityId) instanceof PlayerEntity;
  }

  public static isGameEntity(entityId: number, entities: Map<number, Entity>) {
	return entityId === 1;
  }
}

import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { GameTag } from '../models/enums/game-tags';
import { Entity } from '../models/game/entity';
import { ChangeEntityHistoryItem } from '../models/history/change-entity-history-item';
import { FullEntityHistoryItem } from '../models/history/full-entity-history-item';
import { HistoryItem } from '../models/history/history-item';
import { ShowEntityHistoryItem } from '../models/history/show-entity-history-item';
import { TagChangeHistoryItem } from '../models/history/tag-change-history-item';

@Injectable({
	providedIn: 'root',
})
export class StateProcessorService {
	constructor(private logger: NGXLogger) {}

	private readonly USEFUL_TAGS: readonly GameTag[] = [
		GameTag.TAG_SCRIPT_DATA_NUM_1,
		GameTag.TAG_SCRIPT_DATA_NUM_2,
		GameTag.PREMIUM,
		GameTag.STEP,
		GameTag.TURN,
		GameTag.CURRENT_PLAYER,
		GameTag.RESOURCES_USED,
		GameTag.RESOURCES,
		GameTag.HERO_ENTITY,
		GameTag.PLAYER_ID,
		GameTag.ATTACHED,
		GameTag.EXHAUSTED,
		GameTag.DAMAGE,
		GameTag.HEALTH,
		GameTag.ATK,
		GameTag.COST,
		GameTag.ZONE,
		GameTag.CONTROLLER,
		GameTag.DURABILITY,
		GameTag.CARDTYPE,
		GameTag.SECRET,
		GameTag.ZONE_POSITION,
		GameTag.OVERLOAD_OWED,
		GameTag.MULLIGAN_STATE,
		GameTag.CREATOR,
		GameTag.PARENT_CARD,
		GameTag.OVERLOAD_LOCKED,
		GameTag.HIDE_STATS,
		GameTag.QUEST,
		GameTag.HERO_POWER_DISABLED,
		GameTag.CANT_BE_DAMAGED,
		GameTag.DIVINE_SHIELD,
		GameTag.SILENCED,
		GameTag.FROZEN,
		GameTag.STEALTH,
		GameTag.CANT_BE_TARGETED_BY_ABILITIES,
		GameTag.CANT_BE_TARGETED_BY_HERO_POWERS,
		GameTag.WINDFURY,
		GameTag._333,
		GameTag.EXHAUSTED,
		GameTag.JUST_PLAYED,
		GameTag.POISONOUS,
		GameTag.LIFESTEAL,
		GameTag.DEATH_RATTLE,
		GameTag.INSPIRE,
		GameTag.TRIGGER_VISUAL,
		GameTag.HIDDEN_CHOICE,
		GameTag.CURRENT_SPELLPOWER,
		GameTag.RECEIVES_DOUBLE_SPELLDAMAGE_BONUS,
		GameTag.SPELLPOWER_DOUBLE,
		GameTag.CURRENT_HEROPOWER_DAMAGE_BONUS,
		GameTag.HERO_POWER_DOUBLE,
		GameTag.TAG_SCRIPT_DATA_NUM_1,
		GameTag.PREMIUM,
		GameTag.HERO_POWER_DISABLED,
		GameTag.PLAYSTATE,
		GameTag.CHARGE,
		GameTag.ARMOR,
		GameTag.TAUNT,
		GameTag.HEAVILY_ARMORED,
		GameTag.QUEST_PROGRESS,
		GameTag.QUEST_PROGRESS_TOTAL,

		GameTag.NUM_RESOURCES_SPENT_THIS_GAME,
		GameTag.NUM_CARDS_PLAYED_THIS_TURN,
	];

	public applyHistoryUntilNow(
		previousStateEntities: Map<number, Entity>,
		history: readonly HistoryItem[],
		previousProcessedItem: HistoryItem,
		item: HistoryItem,
	): Map<number, Entity> {
		const startIndex = history.indexOf(previousProcessedItem);
		const stopIndex = history.indexOf(item);
		const futureHistory = history.slice(startIndex, stopIndex);
		let newStateEntities = previousStateEntities;
		for (const historyItem of futureHistory) {
			newStateEntities = this.applyHistory(newStateEntities, historyItem);
		}
		return newStateEntities;
	}

	private applyHistory(entities: Map<number, Entity>, item: HistoryItem): Map<number, Entity> {
		if (item instanceof TagChangeHistoryItem) {
			return this.updateWithTagChange(item, entities);
		} else if (item instanceof ShowEntityHistoryItem || item instanceof FullEntityHistoryItem) {
			return this.updateWithEntity(item, entities);
		} else if (item instanceof ChangeEntityHistoryItem) {
			return this.updateWithChangeEntity(item, entities);
		}
		return entities;
		// TODO: options, choices, chosen entities
	}

	private updateWithEntity(
		historyItem: ShowEntityHistoryItem | FullEntityHistoryItem,
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		const entity: Entity = entities.get(historyItem.entityDefintion.id).update(historyItem.entityDefintion);
		return entities.set(entity.id, entity);
	}

	private updateWithChangeEntity(
		historyItem: ChangeEntityHistoryItem,
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		const entity: Entity = entities.get(historyItem.entityDefintion.id).update(historyItem.entityDefintion);
		return entities.set(entity.id, entity);
	}

	private updateWithTagChange(historyItem: TagChangeHistoryItem, entities: Map<number, Entity>): Map<number, Entity> {
		// Only a limited number of tags are useful for replay reconstitution. If the tag isn't
		// one of them, we simply ignore it. Thanks to this, we will have less differences
		// between our entities, which will improve the memory footprint and performances
		if (this.USEFUL_TAGS.indexOf(historyItem.tag.tag) === -1) {
			return entities;
		}
		// No default creation - if the entity is not registered yet, it's a bug
		// It sometimes happens that the XML itself doesn't have the right entity
		// so we safeguard here
		if (!entities.get(historyItem.tag.entity)) {
			return entities;
		}

		const entity: Entity = entities
			.get(historyItem.tag.entity)
			.updateTag(historyItem.tag.tag, historyItem.tag.value);
		return entities.set(entity.id, entity);
	}
}

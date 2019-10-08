import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { parser, SAXParser, Tag } from 'sax';
import { GameTag } from '../models/enums/game-tags';
import { MetaTags } from '../models/enums/meta-tags';
import { ActionHistoryItem } from '../models/history/action-history-item';
import { ChangeEntityHistoryItem } from '../models/history/change-entity-history-item';
import { ChoicesHistoryItem } from '../models/history/choices-history-item';
import { ChosenEntityHistoryItem } from '../models/history/chosen-entities-history-item';
import { FullEntityHistoryItem } from '../models/history/full-entity-history-item';
import { GameHistoryItem } from '../models/history/game-history-item';
import { HistoryItem } from '../models/history/history-item';
import { MetadataHistoryItem } from '../models/history/metadata-history-item';
import { OptionsHistoryItem } from '../models/history/options-history-item';
import { PlayerHistoryItem } from '../models/history/player-history-item';
import { ShowEntityHistoryItem } from '../models/history/show-entity-history-item';
import { TagChangeHistoryItem } from '../models/history/tag-change-history-item';
import { Choices } from '../models/parser/choices';
import { ChosenTag } from '../models/parser/chosen-tag';
import { EnrichedTag } from '../models/parser/enriched-tag';
import { EntityDefinition } from '../models/parser/entity-definition';
import { EntityDefinitionAttribute } from '../models/parser/entity-definition-attribute';
import { EntityTag } from '../models/parser/entity-tag';
import { Info } from '../models/parser/info';
import { MetaData } from '../models/parser/metadata';
import { Option } from '../models/parser/option';

// Don't inject it, because of the global state
export class XmlParserService {
	private stack: EnrichedTag[];
	private state: string[];
	private index: number;
	private initialTimestamp: number;
	private history: readonly HistoryItem[];
	private entityDefinition: EntityDefinition;
	private choices: Choices;
	private chosen: ChosenTag;
	private metaData: MetaData;
	private timestamp: number;

	constructor(private logger: NGXLogger) {}

	public parseXml(xmlAsString: string): readonly HistoryItem[] {
		this.reset();
		const saxParser: SAXParser = parser(true, {
			trim: true,
		});
		saxParser.onopentag = (tag: Tag) => this.onOpenTag(tag);
		saxParser.onclosetag = (tagName: string) => this.onCloseTag();
		saxParser.onerror = error => this.logger.error('Error while parsing xml', error);
		saxParser.write(xmlAsString).end();
		return this.history;
	}

	onOpenTag(tag: Tag) {
		this.stack.push(tag);
		if (this[`${this.state[this.state.length - 1]}State`]) {
			this[`${this.state[this.state.length - 1]}State`](tag);
		}
	}

	onCloseTag() {
		const tag = this.stack.pop();
		if (this[`${this.state[this.state.length - 1]}StateClose`]) {
			this[`${this.state[this.state.length - 1]}StateClose`](tag);
		}
	}

	rootState(node: EnrichedTag) {
		node.index = this.index++;
		let name = undefined;
		let ts = undefined;
		switch (node.name) {
			case 'Game':
				this.initialTimestamp = this.tsToSeconds(node.attributes.ts);
				this.timestamp = 0;
				break;
			case 'Action':
			case 'Block':
				ts = this.tsToSeconds(node.attributes.ts);
				const item: ActionHistoryItem = new ActionHistoryItem(node, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(item);
				this.state.push('action');
				break;
			case 'ShowEntity':
				let showEntities: readonly EntityDefinition[] = this.stack[this.stack.length - 2].showEntities || [];
				showEntities = [...showEntities, this.entityDefinition];
				this.stack[this.stack.length - 2].showEntities = showEntities;
			/* falls through */
			case 'Player':
				// Remove the battle tag, if present
				name =
					node.attributes.name && node.attributes.name.indexOf('#') !== -1
						? node.attributes.name.split('#')[0]
						: node.attributes.name;
			/* falls through */
			case 'GameEntity':
			case 'FullEntity':
			case 'ChangeEntity':
				name = name || node.attributes.name;
				this.state.push('entity');
				const attributes = Object.assign({}, this.entityDefinition.attributes, { ts: this.tsToSeconds(node.attributes.ts) });
				const newAttributes: EntityDefinition = {
					id: parseInt(node.attributes.entity || node.attributes.id),
					attributes,
					index: this.index++,
					cardID: node.attributes.cardID,
					name,
					tags: this.entityDefinition.tags, // Avoid the hassle of merging tags, just get the ones from source
					playerID: parseInt(node.attributes.playerID),
				};
				Object.assign(this.entityDefinition, newAttributes);
				break;
			case 'TagChange':
				const tag: EntityTag = {
					index: this.index++,
					entity: parseInt(node.attributes.entity),
					tag: parseInt(node.attributes.tag) as GameTag,
					value: parseInt(node.attributes.value),
					parentIndex: this.stack[this.stack.length - 2].index,
				};
				let parentTags: readonly EntityTag[] = this.stack[this.stack.length - 2].tags || [];
				parentTags = [...parentTags, tag];
				this.stack[this.stack.length - 2].tags = parentTags;
				const tagItem: TagChangeHistoryItem = new TagChangeHistoryItem(tag, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(tagItem);
				break;
			case 'Options':
				this.state.push('options');
				break;
			case 'ChosenEntities':
				this.chosen = {
					entity: parseInt(node.attributes.entity),
					playerID: parseInt(node.attributes.playerID),
					ts: this.tsToSeconds(node.attributes.ts),
					cards: [],
					index: this.index++,
				};
				this.state.push('chosenEntities');
				break;
		}
	}

	actionState(node: EnrichedTag) {
		node.index = this.index++;
		const ts = node.attributes.ts ? this.tsToSeconds(node.attributes.ts) : null;
		switch (node.name) {
			case 'ShowEntity':
			case 'FullEntity':
			case 'ChangeEntity':
				this.state.push('entity');
				const attributes: EntityDefinitionAttribute = Object.assign({}, this.entityDefinition.attributes, {
					ts: this.tsToSeconds(node.attributes.ts),
					triggerKeyword: parseInt(node.attributes.triggerKeyword) || 0,
				});
				const newAttributes: EntityDefinition = {
					id: parseInt(node.attributes.entity || node.attributes.id),
					index: this.index++,
					attributes,
					cardID: node.attributes.cardID,
					name: node.attributes.name,
					tags: this.entityDefinition.tags, // Avoid the hassle of merging tags, just get the ones from source
					playerID: parseInt(node.attributes.playerID),
					parentIndex: this.stack[this.stack.length - 2].index,
				};
				Object.assign(this.entityDefinition, newAttributes);

				if (node.name === 'ShowEntity') {
					let showEntities: readonly EntityDefinition[] = this.stack[this.stack.length - 2].showEntities || [];
					showEntities = [...showEntities, this.entityDefinition];
					this.stack[this.stack.length - 2].showEntities = showEntities;
				} else if (node.name === 'FullEntity') {
					let fullEntities: readonly EntityDefinition[] = this.stack[this.stack.length - 2].fullEntities || [];
					fullEntities = [...fullEntities, this.entityDefinition];
					this.stack[this.stack.length - 2].fullEntities = fullEntities;
				}
				break;
			case 'HideEntity':
				const hideAttributes: EntityDefinition = {
					id: parseInt(node.attributes.entity || node.attributes.id),
					index: this.index++,
					parentIndex: this.stack[this.stack.length - 2].index,
					tags: this.entityDefinition.tags, // Avoid the hassle of merging tags, just get the ones from source
				};
				Object.assign(this.entityDefinition, hideAttributes);

				let hideEntities: readonly number[] = this.stack[this.stack.length - 2].hideEntities || [];
				hideEntities = [...hideEntities, this.entityDefinition.id];
				this.stack[this.stack.length - 2].hideEntities = hideEntities;
				break;
			case 'TagChange':
				const tag: EntityTag = {
					index: this.index++,
					entity: parseInt(node.attributes.entity),
					tag: parseInt(node.attributes.tag) as GameTag,
					value: parseInt(node.attributes.value),
					parentIndex: this.stack[this.stack.length - 2].index,
				};
				let parentTags: readonly EntityTag[] = this.stack[this.stack.length - 2].tags || [];
				parentTags = [...parentTags, tag];
				this.stack[this.stack.length - 2].tags = parentTags;
				const tagItem: TagChangeHistoryItem = new TagChangeHistoryItem(tag, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(tagItem);
				break;
			case 'MetaData':
				this.metaData = {
					meta: MetaTags[parseInt(node.attributes.meta || node.attributes.entity)],
					data: parseInt(node.attributes.data),
					parentIndex: this.stack[this.stack.length - 2].index,
					ts,
					info: [],
					index: this.index++,
				};
				const metaItem: MetadataHistoryItem = new MetadataHistoryItem(this.metaData, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(metaItem);
				let parentMeta: readonly MetaData[] = this.stack[this.stack.length - 2].meta || [];
				parentMeta = [...parentMeta, this.metaData];
				this.stack[this.stack.length - 2].meta = parentMeta;
				this.state.push('metaData');
				break;
			case 'Action':
			case 'Block':
				node.parentIndex = this.stack[this.stack.length - 2].index;
				this.state.push('action');
				const item: ActionHistoryItem = new ActionHistoryItem(node, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(item);
				break;
			case 'Choices':
				this.choices = {
					entity: parseInt(node.attributes.entity),
					max: parseInt(node.attributes.max),
					min: parseInt(node.attributes.min),
					playerID: parseInt(node.attributes.playerID),
					source: parseInt(node.attributes.source),
					type: parseInt(node.attributes.type),
					ts: this.tsToSeconds(node.attributes.ts),
					index: this.index++,
					cards: [],
				};
				this.state.push('choices');
				break;
			case 'ChosenEntities':
				this.chosen = {
					entity: parseInt(node.attributes.entity),
					playerID: parseInt(node.attributes.playerID),
					ts: this.tsToSeconds(node.attributes.ts),
					cards: [],
					index: this.index++,
				};
				this.state.push('chosenEntities');
				break;
		}
	}

	actionStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'Action':
			case 'Block':
				this.state.pop();
		}
	}

	blockState(node: EnrichedTag) {
		node.index = this.index++;
		this.actionState(node);
	}

	blockStateClose(node: EnrichedTag) {
		this.actionStateClose(node);
	}

	metaDataState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Info':
				const info: Info = {
					entity: parseInt(node.attributes.id || node.attributes.entity),
					parent: this.metaData,
				};
				let infos: readonly Info[] = this.metaData.info;
				infos = [...infos, info];
				Object.assign(this.metaData, { info: infos });
				break;
		}
	}

	metaDataStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'MetaData':
				this.state.pop();
		}
	}

	chosenEntitiesState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Choice':
				let cards: readonly number[] = this.chosen.cards;
				cards = [...cards, parseInt(node.attributes.entity)];
				Object.assign(this.chosen, { cards });
		}
	}

	chosenEntitiesStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'ChosenEntities':
				this.state.pop();
				const item: ChosenEntityHistoryItem = new ChosenEntityHistoryItem(
					this.chosen,
					this.buildTimestamp(this.chosen.ts),
					node.index,
				);
				this.enqueueHistoryItem(item);
		}
	}

	optionsState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Option':
				const option: Option = {
					entity: parseInt(node.attributes.entity),
					optionIndex: parseInt(node.attributes.index),
					error: parseInt(node.attributes.error),
					type: parseInt(node.attributes.type),
					parentIndex: this.stack[this.stack.length - 2].index,
					index: this.index++,
				};
				let options: readonly Option[] = this.stack[this.stack.length - 2].options || [];
				options = [...options, option];
				this.stack[this.stack.length - 2].options = options;
		}
	}

	optionsStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'Options':
				this.state.pop();
				const ts = this.tsToSeconds(node.attributes.ts);
				const item: OptionsHistoryItem = new OptionsHistoryItem(node, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(item);
		}
	}

	entityState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Tag':
				const newTags: Map<string, number> = this.entityDefinition.tags.set(
					GameTag[parseInt(node.attributes.tag)],
					parseInt(node.attributes.value),
				);
				Object.assign(this.entityDefinition, { tags: newTags });
		}
	}

	entityStateClose(node: EnrichedTag) {
		const ts = node.attributes.ts ? this.tsToSeconds(node.attributes.ts) : null;
		switch (node.name) {
			case 'GameEntity':
				this.state.pop();
				const gameItem: GameHistoryItem = new GameHistoryItem(this.entityDefinition, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(gameItem);
				this.entityDefinition = { tags: Map() };
				break;
			case 'Player':
				this.state.pop();
				const playerItem: PlayerHistoryItem = new PlayerHistoryItem(this.entityDefinition, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(playerItem);
				this.entityDefinition = { tags: Map() };
				break;
			case 'FullEntity':
				this.state.pop();
				const fullEntityItem: FullEntityHistoryItem = new FullEntityHistoryItem(
					this.entityDefinition,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(fullEntityItem);
				this.entityDefinition = { tags: Map() };
				break;
			case 'ShowEntity':
				this.state.pop();
				const showEntityItem: ShowEntityHistoryItem = new ShowEntityHistoryItem(
					this.entityDefinition,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(showEntityItem);
				this.entityDefinition = { tags: Map() };
				break;
			case 'ChangeEntity':
				this.state.pop();
				const changeEntityItem: ChangeEntityHistoryItem = new ChangeEntityHistoryItem(
					this.entityDefinition,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(changeEntityItem);
				this.entityDefinition = { tags: Map() };
				break;
		}
	}

	choicesState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Choice':
				let cards = this.choices.cards || [];
				cards = [...cards, parseInt(node.attributes.entity)];
				Object.assign(this.choices, { cards });
		}
	}

	choicesStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'Choices':
				this.state.pop();
				const choicesItem: ChoicesHistoryItem = new ChoicesHistoryItem(
					this.choices,
					this.buildTimestamp(this.choices.ts),
					node.index,
				);
				this.enqueueHistoryItem(choicesItem);
		}
	}

	private buildTimestamp(ts?: number): number {
		ts = ts || this.timestamp;
		this.timestamp = ts;
		return this.timestamp;
	}

	private enqueueHistoryItem(item: HistoryItem) {
		if (item.timestamp === undefined) {
			this.logger.error('History item doesn\'t have timestamp', item);
			throw new Error('History item doesn\'t have timestamp' + item);
		}
		this.history = [...(this.history || []), item];
	}

	private reset() {
		this.stack = [];
		this.state = ['root'];
		this.index = 0;
		this.initialTimestamp = undefined;
		this.history = [];
		this.entityDefinition = {
			tags: Map(),
		};
		this.choices = undefined;
		this.chosen = undefined;
		this.metaData = undefined;
		this.timestamp = undefined;
	}

	private tsToSeconds(ts: string): number {
		if (!ts) {
			return undefined;
		}
		// Format of timestamp is HH:mm:ss.SSSSSSSSS
		const tsWithoutMillis = ts.split('.')[0];
		const split = tsWithoutMillis.split(':');
		const tsInSeconds: number = parseInt(split[2]) + 60 * parseInt(split[1]) + 3600 * parseInt(split[0]);
		return tsInSeconds - (this.initialTimestamp || 0);
	}
}

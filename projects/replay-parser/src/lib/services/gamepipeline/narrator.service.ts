import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Game } from '../../models/game/game';

@Injectable({
	providedIn: 'root',
})
export class NarratorService {
	constructor(private logger: NGXLogger) {}

	public populateActionTextForLastTurn(game: Game) {
		let turnsWithActions = game.turns;
		const numberOfTurns = turnsWithActions.size;
		// this.logger.debug('getting turn', i, game.turns.toJS());
		const turn = game.turns.get(numberOfTurns - 1);
		const enrichedActions = turn.actions.map(action => {
			try {
				return action.enrichWithText();
			} catch (e) {
				this.logger.warn('Could not enrich action with text', e, action);
				return action;
			}
		});
		const enrichedTurn = turn.update({ actions: enrichedActions });
		turnsWithActions = turnsWithActions.set(numberOfTurns - 1, enrichedTurn);
		return Game.createGame(game, { turns: turnsWithActions } as Game);
	}

	public createGameStoryForLastTurn(game: Game): Game {
		const allActionsInLastTurn = game.turns.last().actions;
		const fullStoryRawForLastTurn: string = allActionsInLastTurn.map(action => action.textRaw).join('\n');
		// this.logger.debug('[narrator] full story', fullStoryRaw);
		return Game.createGame(game, { fullStoryRaw: game.fullStoryRaw + '\n' + fullStoryRawForLastTurn } as Game);
	}
}

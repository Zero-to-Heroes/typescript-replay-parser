import { GameAction } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-action';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';

export class ExtendedGameSample implements GameSample {
	readonly actions: readonly GameAction[];
	readonly playerCardId: string;
	readonly playerHeroPowerCardId: string;
	readonly playerEntityId: number;
	readonly opponentCardId: string;
	readonly opponentHeroPowerCardId: string;
	readonly opponentEntityId: number;
}

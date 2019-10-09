import { replay } from '../test/replay';
import { Game } from './lib/models/game/game';
import { GameParserService } from './lib/services/game-parser.service';

describe('test public API in standalone mode', () => {
  it('should be created', async () => {
	const service: GameParserService = await GameParserService.create();
	expect(service).toBeTruthy();
  }, 50000);

  fit('should parse the full game', async (done: DoneFn) => {
	const service: GameParserService = await GameParserService.create();
	const obs = await service.parse(replay);
	obs.subscribe(([game, status, complete]: [Game, string, boolean]) => {
		if (complete) {
		expect(game.turns.size).toBeGreaterThan(1);
		done();
		}
	});
  }, 50000);
});

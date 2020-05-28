import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { replay } from '../test/replay';
import { Game } from './lib/models/game/game';
import { GameParserService } from './lib/services/game-parser.service';

describe('test public API', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			imports: [HttpClientModule],
		}),
	);

	it('should be created', () => {
		const service: GameParserService = TestBed.get(GameParserService);
		expect(service).toBeTruthy();
	});

	it('should parse the full game', async (done: DoneFn) => {
		const service: GameParserService = TestBed.get(GameParserService);
		const obs = await service.parse(replay);
		obs.subscribe(([game, status, complete]: [Game, string, boolean]) => {
			if (complete) {
				expect(game.turns.size).toBeGreaterThan(1);
				done();
			}
		});
	});
});

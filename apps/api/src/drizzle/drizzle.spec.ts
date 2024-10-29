import { Test, TestingModule } from '@nestjs/testing';
import { Drizzle } from './drizzle';

describe('Drizzle', () => {
  let provider: Drizzle;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Drizzle],
    }).compile();

    provider = module.get<Drizzle>(Drizzle);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});

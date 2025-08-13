import { Test, TestingModule } from '@nestjs/testing';
import { BrochuresService } from './brochures.service';

describe('BrochuresService', () => {
  let service: BrochuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrochuresService],
    }).compile();

    service = module.get<BrochuresService>(BrochuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

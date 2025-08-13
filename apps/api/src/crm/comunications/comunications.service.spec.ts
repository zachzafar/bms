import { Test, TestingModule } from '@nestjs/testing';
import { ComunicationsService } from './comunications.service';

describe('ComunicationsService', () => {
  let service: ComunicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComunicationsService],
    }).compile();

    service = module.get<ComunicationsService>(ComunicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

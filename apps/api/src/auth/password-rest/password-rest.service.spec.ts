import { Test, TestingModule } from '@nestjs/testing';
import { PasswordRestService } from './password-rest.service';

describe('PasswordRestService', () => {
  let service: PasswordRestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordRestService],
    }).compile();

    service = module.get<PasswordRestService>(PasswordRestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

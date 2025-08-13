import { Test, TestingModule } from '@nestjs/testing';
import { ComunicationsController } from './comunications.controller';

describe('ComunicationsController', () => {
  let controller: ComunicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComunicationsController],
    }).compile();

    controller = module.get<ComunicationsController>(ComunicationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

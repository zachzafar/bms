import { Test, TestingModule } from '@nestjs/testing';
import { BrochuresController } from './brochures.controller';

describe('BrochuresController', () => {
  let controller: BrochuresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrochuresController],
    }).compile();

    controller = module.get<BrochuresController>(BrochuresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

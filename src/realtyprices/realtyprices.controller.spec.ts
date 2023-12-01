import { Test, TestingModule } from '@nestjs/testing';
import { RealtypricesController } from './realtyprices.controller';

describe('RealtypricesController', () => {
  let controller: RealtypricesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealtypricesController],
    }).compile();

    controller = module.get<RealtypricesController>(RealtypricesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

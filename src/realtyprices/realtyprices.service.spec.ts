import { Test, TestingModule } from '@nestjs/testing';
import { RealtypricesService } from './realtyprices.service';

describe('RealtypricesService', () => {
  let service: RealtypricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtypricesService],
    }).compile();

    service = module.get<RealtypricesService>(RealtypricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

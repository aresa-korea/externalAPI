import { Controller, Get, Query } from '@nestjs/common';
import { RealtypricesService } from './realtyprices.service';

@Controller('realtyprices')
export class RealtypricesController {
  constructor(private readonly realtypricesService: RealtypricesService) {
    // Add your constructor logic here
  }

  @Get()
  async getRealtyPrice(@Query('address') address: string): Promise<object> {
    console.log('getRealtyPrice ==========> 시작');
    // const address = '서울특별시 강남구 삼성동 10-10 301호';
    // const address = '서울특별시 용산구 한남동 810 제111동 302호';

    return await this.realtypricesService.getRealtyPrice(address);
  }
}

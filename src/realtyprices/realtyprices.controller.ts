import { Controller, Get, Query } from '@nestjs/common';
import { RealtypricesService } from './realtyprices.service';

@Controller('realtyprices')
export class RealtypricesController {
  constructor(private readonly realtypricesService: RealtypricesService) {
    // Add your constructor logic here
  }

  // { fullCode: "4311425345", bunji: "810-2", dongName: "101", hoName: "902" }

  @Get()
  async getRealtyPrice(
    @Query('fullCode') fullCode: string,
    @Query('bunji') bunji: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
  ): Promise<object> {
    console.log('getRealtyPrice ==========> 시작');

    return await this.realtypricesService.getRealtyPrice({
      fullCode,
      bunji,
      dongName,
      hoName,
    });
  }
  @Get('withAddress')
  async getRealtyPriceWithAddress(
    @Query('address') address: string,
  ): Promise<object> {
    console.log('getRealtyPriceWithAddress ==========> 시작');
    // const address = '서울특별시 강남구 삼성동 10-10 301호';
    // const address = '서울특별시 용산구 한남동 810 제111동 302호';

    return await this.realtypricesService.getRealtyPriceWithAddress(address);
  }

  @Get('testParsingAddress')
  async testParsingAddress(@Query('address') address: string): Promise<object> {
    console.log('testParsingAddress ==========> 시작');
    return await this.realtypricesService.parsingAddress(address);
  }

  @Get('makeSigunguJson')
  async makeSigunguJson(): Promise<object> {
    console.log('makeSigunguJson ==========> 시작');
    return await this.realtypricesService.makeSigunguJson();
  }

  @Get('makeDongriJson')
  async makeDongriJson(): Promise<object> {
    console.log('makeDongriJson ==========> 시작');
    return await this.realtypricesService.makeDongriJson();
  }

  @Get('makeRoadAddrJson')
  async makeRoadAddrJson(): Promise<object> {
    console.log('makeRoadAddrJson ==========> 시작');
    // return await this.realtypricesService.makeRoadAddrJson();
    return await this.realtypricesService.makeBldInfoJson();
  }
}

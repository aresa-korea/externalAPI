import { Controller, Get, Post, Query } from '@nestjs/common';
import { BldRgstService } from './bld-rgst.service';

@Controller('bld-rgst')
export class BldRgstController {
  constructor(private readonly bldRgstService: BldRgstService) {}

  @Get()
  async getBldRgst(
    @Query() search: { addressType; queryAddress; hoNm; dongNm },
  ): Promise<any> {
    try {
      const { addressType, queryAddress, hoNm, dongNm } = search;

      const getPdfResult = await this.bldRgstService.getBldRgst(
        addressType,
        queryAddress,
        hoNm,
        dongNm,
      );

      return getPdfResult;
    } catch (e) {
      console.log(e);
    }
  }

  @Post('bulk')
  async getBldRgsts(
    @Query() search: { addressType; queryAddress; hoNm; dongNm },
  ): Promise<any> {
    // 테스트 해야합니다.
    try {
      const { addressType, queryAddress, hoNm, dongNm } = search;

      const getPdfResult = await this.bldRgstService.getBldRgst(
        addressType,
        queryAddress,
        hoNm,
        dongNm,
      );

      return getPdfResult;
    } catch (e) {
      console.log(e);
    }
  }
}

import { Controller, Get, Query } from '@nestjs/common';
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
}

import { Controller, Get, Query, Res } from '@nestjs/common';
import { BldRgstService } from './bld-rgst.service';
import { Response } from 'express';

@Controller('bld-rgst')
export class BldRgstController {
  constructor(private readonly bldRgstService: BldRgstService) {}

  @Get()
  async getBldRgst(
    @Query('addressType') addressType: string,
    @Query('queryAddress') queryAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
  ): Promise<any> {
    try {
      return await this.bldRgstService.getBldRgst(
        addressType,
        queryAddress,
        hoName,
        dongName,
      );
    } catch (e) {
      console.log(e);
    }
  }

  @Get('download')
  async downloadBldRgst(
    @Query('roadAddress') roadAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
    @Res() response: Response,
  ): Promise<any> {
    try {
      roadAddress = roadAddress.trim().replace(/\s/g, '_').replace(/__/g, '_');
      const directory = `odocs/${roadAddress}_${dongName || '0'}_${
        hoName || '0'
      }/bld-rgst`;
      return await this.bldRgstService.downloadBldRgst(directory, response);
    } catch (e) {
      console.log(e);
    }
  }
}

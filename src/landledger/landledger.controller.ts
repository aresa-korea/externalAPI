import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { LandledgerService } from './landledger.service';

@Controller('landledger')
export class LandledgerController {
  constructor(private readonly landledgerService: LandledgerService) {
    // Add your constructor logic here
  }

  @Get()
  async getPnuCd(
    @Query('roadAddress') roadAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
  ): Promise<any> {
    try {
      if (!roadAddress) {
        throw new BadRequestException('roadAddress are required.');
      }

      return await this.landledgerService.getPnuCd(
        dongName && hoName
          ? `${roadAddress} ${dongName}동 ${hoName}호`
          : !dongName && hoName
            ? `${roadAddress} ${hoName}호`
            : roadAddress,
      );
    } catch (e) {
      console.log(e);
    }
  }

  @Post()
  async getLandLedger(
    @Query('roadAddress') roadAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
    @Query('userId') userId: string,
    @Query('type') type: string,
  ) {
    if (!roadAddress) {
      throw new BadRequestException('roadAddress are required.');
    }

    try {
      const jusoInfo = await this.landledgerService.getPnuCd(
        dongName && hoName
          ? `${roadAddress} ${dongName}동 ${hoName}호`
          : !dongName && hoName
            ? `${roadAddress} ${hoName}호`
            : roadAddress,
      );

      if (jusoInfo.pnu) {
        return this.landledgerService.getLandLedger(
          jusoInfo.pnu,
          roadAddress,
          dongName,
          hoName,
          userId || '',
          type,
        );
      } else {
        return jusoInfo;
      }
    } catch (e) {
      console.log(e);
    }
  }

  @Get('download')
  async downloadBldRgst(
    @Query('roadAddress') roadAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
    @Query('userId') userId: string,
    @Res() response: Response,
  ): Promise<any> {
    try {
      roadAddress = roadAddress.trim().replace(/\s/g, '_').replace(/__/g, '_');
      const directory = `odocs${userId ? '/' + userId : ''}/${roadAddress}_${
        dongName || '0'
      }_${hoName || '0'}/land-ledger`;
      return await this.landledgerService.downloadLandLedger(
        directory,
        response,
      );
    } catch (e) {
      console.log(e);
    }
  }
}

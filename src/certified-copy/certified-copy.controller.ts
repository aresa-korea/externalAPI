import { Controller, Get, Query, Res } from '@nestjs/common';
import { CertifiedCopyService } from './certified-copy.service';

@Controller('certified-copy')
export class CertifiedCopyController {
  constructor(private readonly certifiedCopyService: CertifiedCopyService) {}

  @Get()
  async getCertifiedCopy(
    @Query('roadAddress') roadAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
  ): Promise<any> {
    try {
      return await this.certifiedCopyService.getCertifiedCopy(
        dongName && hoName
          ? `${roadAddress} ${dongName} ${hoName}`
          : !dongName && hoName
            ? `${roadAddress} ${hoName}`
            : roadAddress,
        roadAddress,
        dongName,
        hoName,
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
      }/certified-copy`;
      return await this.certifiedCopyService.downloadCertifiedCopy(
        directory,
        response,
      );
    } catch (e) {
      console.log(e);
    }
  }
}

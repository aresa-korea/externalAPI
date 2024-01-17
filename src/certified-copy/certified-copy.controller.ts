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
    @Query('userId') userId: string,
    @Query('sangtae') sangtae: string = '0',
    @Query('kindClsFlag') kindClsFlag: string = '0',
    @Query('type') type: string,
  ): Promise<any> {
    try {
      const address = this.createAddress(roadAddress, dongName, hoName);
      const uniqueNoRes = await this.certifiedCopyService.getUniqueNo(
        address,
        sangtae,
        kindClsFlag,
      );
      const filePath = this.createFilePath(
        userId,
        roadAddress,
        dongName,
        hoName,
      );
      const saveFileName = address;

      return await this.certifiedCopyService.getCertifiedCopy(
        uniqueNoRes,
        filePath,
        saveFileName,
        type,
      );
    } catch (e) {
      console.log(e);
    }
  }

  @Get('download')
  async downloadCertifiedCopy(
    @Query('roadAddress') roadAddress: string,
    @Query('dongName') dongName: string,
    @Query('hoName') hoName: string,
    @Query('kindClsFlag') kindClsFlag: string,
    @Query('userId') userId: string,
    @Res() response: Response,
  ): Promise<any> {
    try {
      roadAddress = roadAddress.trim().replace(/\s/g, '_').replace(/__/g, '_');
      if (kindClsFlag === '3') {
        const directory = `odocs${userId ? '/' + userId : ''}/${roadAddress}_${
          dongName || '0'
        }_${hoName || '0'}/land-copy`;
        return await this.certifiedCopyService.downloadLandCopy(
          directory,
          response,
        );
      } else {
        const directory = `odocs${userId ? '/' + userId : ''}/${roadAddress}_${
          dongName || '0'
        }_${hoName || '0'}/certified-copy`;
        return await this.certifiedCopyService.downloadCertifiedCopy(
          directory,
          response,
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  private createAddress(
    roadAddress: string,
    dongName?: string,
    hoName?: string,
  ): string {
    return dongName && hoName
      ? `${roadAddress} ${dongName} ${hoName}`
      : !dongName && hoName
        ? `${roadAddress} ${hoName}`
        : roadAddress;
  }

  private createFilePath(
    userId: string,
    roadAddress: string,
    dongName?: string,
    hoName?: string,
  ): string {
    return `odocs${userId ? '/' + userId : ''}/${roadAddress.replace(
      '  ',
      '_',
    )}_${dongName || '0'}_${hoName || '0'}/certified-copy`;
  }
}

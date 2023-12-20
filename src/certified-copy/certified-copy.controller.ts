import { Controller, Get, Query } from '@nestjs/common';
import { CertifiedCopyService } from './certified-copy.service';

@Controller('certified-copy')
export class CertifiedCopyController {
  constructor(private readonly certifiedCopyService: CertifiedCopyService) {}

  @Get()
  async getCertifiedCopy(
    @Query() search: { roadAddress; dongName; hoName },
  ): Promise<any> {
    try {
      const { roadAddress, dongName, hoName } = search;

      const formatAddress =
        dongName && hoName
          ? `${roadAddress} ${dongName} ${hoName}`
          : !dongName && hoName
            ? `${roadAddress} ${hoName}`
            : roadAddress;

      const getPdfResult =
        await this.certifiedCopyService.getCertifiedCopy(formatAddress);

      return getPdfResult;
    } catch (e) {
      // 예외처리 해야하는데 어케할까..
      console.log(e);
    }
  }
}

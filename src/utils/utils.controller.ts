import { Controller, Get, Query, Res } from '@nestjs/common';
import { UtilsService } from './utils.service';

@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Get()
  async getFileList(@Query('directory') directory: string): Promise<any> {
    try {
      const files = this.utilsService.getFileList(directory);
      return files;
    } catch (e) {
      console.log(e);
    }
  }

  @Get('download')
  async download(
    @Query('directory') directory: string,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const files = this.utilsService.downloadByRecently(directory, response);
      return files;
    } catch (e) {
      console.log(e);
    }
  }
}

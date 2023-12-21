import { Module } from '@nestjs/common';
import { BldRgstController } from './bld-rgst.controller';
import { BldRgstService } from './bld-rgst.service';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  controllers: [BldRgstController],
  providers: [BldRgstService, TilkoApiService, UtilsService],
})
export class BldRgstModule {}

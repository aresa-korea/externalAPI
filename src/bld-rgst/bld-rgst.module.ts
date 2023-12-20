import { Module } from '@nestjs/common';
import { BldRgstController } from './bld-rgst.controller';
import { BldRgstService } from './bld-rgst.service';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';

@Module({
  controllers: [BldRgstController],
  providers: [BldRgstService, TilkoApiService],
})
export class BldRgstModule {}

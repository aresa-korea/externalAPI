import { Module } from '@nestjs/common';
import { CertifiedCopyController } from './certified-copy.controller';
import { CertifiedCopyService } from './certified-copy.service';
import { HttpModule } from '@nestjs/axios';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  imports: [HttpModule],
  controllers: [CertifiedCopyController],
  providers: [CertifiedCopyService, TilkoApiService, UtilsService],
})
export class CertifiedCopyModule {}

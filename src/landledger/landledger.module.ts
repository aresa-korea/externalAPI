import { Module } from '@nestjs/common';
import { LandledgerController } from './landledger.controller';
import { LandledgerService } from './landledger.service';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  controllers: [LandledgerController],
  providers: [LandledgerService, UtilsService],
})
export class LandledgerModule {}

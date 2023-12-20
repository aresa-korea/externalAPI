import { Module } from '@nestjs/common';
import { LandledgerController } from './landledger.controller';
import { LandledgerService } from './landledger.service';

@Module({
  controllers: [LandledgerController],
  providers: [LandledgerService],
})
export class LandledgerModule {}

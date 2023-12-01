import { Module } from '@nestjs/common';
import { RealtypricesController } from './realtyprices.controller';
import { RealtypricesService } from './realtyprices.service';

@Module({
  controllers: [RealtypricesController],
  providers: [RealtypricesService],
})
export class RealtypricesModule {}

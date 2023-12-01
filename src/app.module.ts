import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RealtypricesModule } from './realtyprices/realtyprices.module';

@Module({
  imports: [RealtypricesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

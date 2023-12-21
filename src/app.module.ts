import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { RealtypricesModule } from './realtyprices/realtyprices.module';
import { LandledgerModule } from './landledger/landledger.module';
import { CertifiedCopyModule } from './certified-copy/certified-copy.module';
import { BldRgstModule } from './bld-rgst/bld-rgst.module';
import { TilkoApiService } from './tilko-api/tilko-api.service';
import { UtilsService } from './utils/utils.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.prod',
    }),
    RealtypricesModule,
    LandledgerModule,
    CertifiedCopyModule,
    BldRgstModule,
  ],
  controllers: [AppController],
  providers: [TilkoApiService, UtilsService],
})
export class AppModule {}

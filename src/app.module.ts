import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { RealtypricesModule } from './realtyprices/realtyprices.module';
import { LandledgerModule } from './landledger/landledger.module';
import { CertifiedCopyModule } from './certified-copy/certified-copy.module';
import { BldRgstModule } from './bld-rgst/bld-rgst.module';
import { TilkoApiService } from './tilko-api/tilko-api.service';
import { UtilsService } from './utils/utils.service';
import { UtilsController } from './utils/utils.controller';
import { UtilsModule } from './utils/utils.module';

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
    UtilsModule,
  ],
  controllers: [AppController, UtilsController],
  providers: [TilkoApiService, UtilsService],
})
export class AppModule {}

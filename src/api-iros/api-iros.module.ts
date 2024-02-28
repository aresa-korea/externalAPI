import { Module } from '@nestjs/common';
import { ApiIrosController } from './api-iros.controller';
import { ApiIrosService } from './api-iros.service';
import { HttpModule } from '@nestjs/axios';
import { UtilsService } from 'src/utils/utils.service';

@Module({
  imports: [HttpModule],
  controllers: [ApiIrosController],
  providers: [ApiIrosService, UtilsService],
})
export class ApiIrosModule {}

import { Body, Controller, Post } from '@nestjs/common';
import { LandledgerService } from './landledger.service';
import { ILandLedger } from './interfaces/landledger.interface';

@Controller('landledger')
export class LandledgerController {
  constructor(private readonly landledgerService: LandledgerService) {
    // Add your constructor logic here
  }

  // Add your routes here
  /*
    {
      "INNB" : "1171010700109130000",
      "RNMGTSN" : "117102005011",
      "BULDMNNM" : "345",
      "BULDSLNO" : "0"
    }
   */
  @Post()
  async getLandLedger(@Body() body: ILandLedger) {
    // Add your business logic here
    // For example, call a service method to handle the request
    const LandLedger = body;
    return this.landledgerService.getLandLedger(LandLedger);
  }
}

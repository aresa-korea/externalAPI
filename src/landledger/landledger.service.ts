import { Injectable } from '@nestjs/common';
import { ILandLedger } from './interfaces/landledger.interface';
import axios from 'axios';

@Injectable()
export class LandledgerService {
  constructor() {
    // You can inject other services or modules here if needed
  }

  async getLandLedger(landLedger: ILandLedger): Promise<any> {
    const url =
      'https://datahub-dev.scraping.co.kr/estate/common/solideo/reg/land-ledger';
    const headers = {
      Authorization: 'Token ******************************',
      'Content-Type': 'application/json;charset=UTF-8',
    };

    return axios.post(url, landLedger, { headers });

    // Return a response or result of the operation
    // This is just a placeholder response
    return {
      status: 'success',
      message: 'Land ledger registered successfully',
    };
  }
}

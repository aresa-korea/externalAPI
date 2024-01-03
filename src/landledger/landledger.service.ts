import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class LandledgerService {
  constructor(private readonly utilsService: UtilsService) {
    // You can inject other services or modules here if needed
    this.USER_ID = 'aresa01bryan';
    this.USER_PW = '1q2w3e4r!';
  }
  private readonly USER_ID = 'aresa01bryan';
  private readonly USER_PW = '1q2w3e4r!';
  private readonly HKEY = 'd8c3dd2830fa2a52';

  private readonly LAND_LEDGER_URL = 'https://api.hyphen.im/in0005000203';
  private readonly PNU_CD_URL = 'https://api.hyphen.im/oa0051000001';

  async getPnuCd(address: string): Promise<any> {
    this.utilsService.startProcess('PNU_CD 조회');

    const body = {
      currentPage: '1',
      countPerPage: '10',
      keyword: address,
    };

    try {
      const respDataResp = await axios.post(this.PNU_CD_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': this.USER_ID,
          Hkey: this.HKEY,
        },
      });

      const respData = respDataResp.data;
      const common = respData.common;
      const jusoList = respData.data.juso;
      if (common === '!N') {
        this.utilsService.endProcess('PNU_CD 조회');

        return {
          errYn: common.errYn,
          errMsg: common.errMsg,
          hyphenTrNo: common.hyphenTrNo,
        };
      }
      if (jusoList.length === 0) {
        this.utilsService.endProcess('PNU_CD 조회');
        return {
          errYn: 'N',
          errMsg: '검색 결과가 없습니다.',
          hyphenTrNo: common.hyphenTrNo,
        };
      }

      this.utilsService.endProcess('PNU_CD 조회');

      return jusoList[0];
    } catch (error) {
      // 오류가 발생한 경우 처리
      throw new Error(`Error calling external service: ${error.message}`);
    }
  }

  async getLandLedger(
    pnuCd: string,
    roadAddress: string,
    dongName: string,
    hoName: string,
    userId: string,
    path = 'land-ledger',
  ): Promise<any> {
    this.utilsService.startProcess('토지대장 발급');

    const body = {
      nonMemberYn: 'N',
      loginMethod: 'ID',
      signCert: '',
      signPri: '',
      signPw: '',
      userId: this.USER_ID,
      userPw: this.USER_PW,
      userName: '',
      bizNo: '',
      hpNo: '',
      regNum: '',
      reqSMS_YN: '',
      pnuCd: pnuCd,
      printGb: '02',
      closureGb: '01',
      priceYearGb: '01',
      priceYear: '',
      noGb: '02',
      requestType: '02',
      recvId: '',
      recvNm: '',
      recvTel1: '',
      recvTel2: '',
      recvTel3: '',
    };
    try {
      const respResp = await axios.post(this.LAND_LEDGER_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': this.USER_ID,
          Hkey: this.HKEY,
        },
      });

      const respOut = respResp.data.out;
      if (respOut.errYn === '!N') {
        this.utilsService.endProcess('토지대장 발급');

        return {
          errYn: respOut.errYn,
          errMsg: respOut.errMsg,
          device: respOut.device,
          CappReqNo: respOut.CappReqNo,
        };
      }

      // HexString to Hex
      const binaryBuffer = Buffer.from(respOut.hexString, 'hex');
      const fileName = this.utilsService.saveToPdf(
        `odocs${userId ? '/' + userId : ''}/${roadAddress.replace('  ', '_')}_${
          dongName || '0'
        }_${hoName || '0'}/${path}`,
        roadAddress,
        binaryBuffer,
      );

      this.utilsService.endProcess('토지대장 발급');
      return {
        Status: 200,
        Message: '파일이 생성되었습니다.',
        TargetMessage: '파일이 생성되었습니다.',
        FileName: fileName, // 파일의 경로를 포함
      };
    } catch (error) {
      // 오류가 발생한 경우 처리
      throw new Error(`Error calling external service: ${error.message}`);
    }
  }

  /**
   * 특정 건물의 pdf 파일 클라이언트로 리턴합니다.
   */
  async downloadLandLedger(directory: string, response): Promise<any> {
    try {
      return this.utilsService.getFileDownload(directory, response);
    } catch (error) {
      console.error('Error reading directory:', error);
      return []; // 디렉토리 읽기 실패 시 빈 배열 반환
    }
  }
}

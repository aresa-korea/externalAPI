import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Crypto from 'crypto';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class BldRgstService {
  private ENDPOINT: string;
  private DTL_URL: string;
  private SEARCH_URL: string;
  private RPTC_URL: string;

  constructor(
    private readonly tilkoApiService: TilkoApiService,
    private readonly utilsService: UtilsService,
  ) {
    this.ENDPOINT = process.env.TILKO_API_ENDPOINT;
    this.DTL_URL = `${this.ENDPOINT}api/v2.0/EaisIdLogin/BldRgstDtl`;
    this.SEARCH_URL = `${this.ENDPOINT}api/v2.0/EaisIdLogin/BldRgstMst`;
    this.RPTC_URL = `${this.ENDPOINT}api/v2.0/EaisIdLogin/RPTCAA02R01`;
  }

  private readonly USER_ID = 'aresa01bryan';
  private readonly USER_PW = '1q2w3e4r!';

  async getBldRgst(
    addressType = '1',
    queryAddress: string,
    hoName: string,
    dongName: string,
    userId: string,
    type: string,
    path = 'bld-rgst',
  ): Promise<any> {
    this.utilsService.startProcess('건축물대장 발급');

    try {
      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);
      const bldRgstMstBody = {
        AddressType: addressType,
        QueryAddress: queryAddress,
      };
      const bldRgstMst = await axios.post(this.SEARCH_URL, bldRgstMstBody, {
        headers,
      });

      const bldRgstMstResp = bldRgstMst.data;
      const { BldRgstSeqNumber, UntClsfCd } = bldRgstMstResp.Result[0];
      const { RegstrKindCd, BldRgstSeqno, UpperBldRgstSeqno, MjrFmlyYn } =
        await this.getDtl(
          aesKey,
          aesIv,
          BldRgstSeqNumber,
          UntClsfCd,
          headers,
          hoName,
          dongName,
        );

      const rptcBody = {
        Auth: {
          UserID: await this.tilkoApiService.aesEncrypt(
            aesKey,
            aesIv,
            this.USER_ID,
          ),
          UserPassword: await this.tilkoApiService.aesEncrypt(
            aesKey,
            aesIv,
            this.USER_PW,
          ),
        },
        PublishType: 0,
        RegstrKindCd,
        UpperBldRgstSeqno: UpperBldRgstSeqno || '',
        BldRgstSeqno,
        UntClsfCd,
        MjrFmlyYn,
      };

      const rptcResp = await axios.post(this.RPTC_URL, rptcBody, { headers });
      const binaryBuffer = Buffer.from(rptcResp.data.Result.PdfData, 'base64');

      if (type === '1') {
        this.utilsService.endProcess('건축물대장 발급');
        return {
          Status: 200,
          Message: '바이너리가 생성되었습니다.',
          TargetMessage: '바이너리가 생성되었습니다.',
          binaryBuffer: binaryBuffer, // 파일의 경로를 포함
        };
      }

      // 경로가 존재하지 않으면 생성
      const fileName = await this.utilsService.saveToPdf(
        `odocs${userId ? '/' + userId : ''}/${queryAddress.replace(
          '  ',
          '_',
        )}_${dongName || '0'}_${hoName || '0'}/${path}`,
        queryAddress,
        binaryBuffer,
      );

      this.utilsService.endProcess('건축물대장 발급');
      return {
        Status: 200,
        Message: '파일이 생성되었습니다.',
        TargetMessage: '파일이 생성되었습니다.',
        FileName: fileName, // 파일의 경로를 포함
      };
    } catch (error) {
      this.utilsService.endProcess('건축물대장 발급');
      console.error('Error:', error.message);
      return {
        Status: 500,
        Message: 'Internal Server Error',
        Error: error.message,
      };
    }
  }

  /**
   * 외부 API를 사용하여 건물 등록 상세 정보를 조회합니다.
   * @param {string} aesKey - AES 키
   * @param {string} aesIv - AES 초기화 벡터
   * @param {string} BldRgstSeqNumber - 건물 등록 일련번호
   * @param {string} UntClsfCd - 단위 분류 코드
   * @param {Object} headers - HTTP 요청 헤더
   * @param {string} hoName - 호 이름
   * @param {string} dongName - 동 이름
   * @returns {Object|null} 조회된 상세 정보 또는 null
   */
  private async getDtl(
    aesKey,
    aesIv,
    BldRgstSeqNumber,
    UntClsfCd,
    headers,
    hoName,
    dongName,
  ) {
    const dtlBody = {
      Auth: {
        UserId: await this.tilkoApiService.aesEncrypt(
          aesKey,
          aesIv,
          this.USER_ID,
        ),
        UserPassword: await this.tilkoApiService.aesEncrypt(
          aesKey,
          aesIv,
          this.USER_PW,
        ),
      },
      BldRgstSeqNumber,
      UntClsfCd,
    };

    try {
      const dtlResp = await axios.post(this.DTL_URL, dtlBody, { headers });
      return this.filterResults(dtlResp.data.Result, dongName, hoName);
    } catch (error) {
      console.error('Error:', error.message);
      return {
        Status: 500,
        Message: 'Internal Server Error',
        Error: error.message,
      };
    }
  }

  /**
   * 결과를 필터링합니다.
   * @param {Array} results - 원본 결과 배열
   * @param {string} dongName - 동 이름
   * @param {string} hoName - 호 이름
   * @returns {Object|null} 필터링된 결과 또는 null
   */
  private filterResults(results, dongName, hoName) {
    if (dongName && hoName) {
      return (
        results.find(
          (dtl) =>
            dtl.DongNm &&
            dtl.HoNm &&
            dtl.DongNm.includes(dongName.replace(/[^0-9]/g, '')) &&
            dtl.HoNm.includes(hoName.replace(/[^0-9]/g, '')),
        ) || null
      );
    }
    if (!dongName && hoName) {
      return (
        results.find(
          (dtl) => dtl.HoNm && dtl.HoNm.includes(hoName.replace(/[^0-9]/g, '')),
        ) || null
      );
    }
    return results[0];
  }

  /**
   * 특정 건물의 pdf 파일 클라이언트로 리턴합니다.
   */
  async downloadBldRgst(directory: string, response): Promise<any> {
    try {
      return this.utilsService.getFileDownload(directory, response);
    } catch (error) {
      console.error('Error reading directory:', error);
      return []; // 디렉토리 읽기 실패 시 빈 배열 반환
    }
  }
}

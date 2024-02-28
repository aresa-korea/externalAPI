import { BadRequestException, Injectable } from '@nestjs/common';
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

  async createBldRgst(
    addressType = '1',
    address: string,
    userId: string,
    path = 'bld-rgst',
  ) {
    this.utilsService.startProcess('건축물대장 발급');
    try {
      console.log(addressType, address, userId, path);

      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);

      // address에서 []사이의 문자열을 제거
      let bldAddress = address
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();
      const addressContext = await this.findAddressByKeywork(bldAddress);
      console.log('addressContext', addressContext[0].roadAddrPart1);
      bldAddress = addressContext[0].roadAddrPart1;
      const bldRgstMstBody = {
        AddressType: addressType,
        QueryAddress: bldAddress,
      };
      const bldRgstMst = await axios.post(this.SEARCH_URL, bldRgstMstBody, {
        headers,
      });

      const bldRgstMstResp = bldRgstMst.data;
      console.log('bldRgstMstResp', bldRgstMstResp);
      const { BldRgstSeqNumber, UntClsfCd } = bldRgstMstResp.Result[0];
      const { RegstrKindCd, BldRgstSeqno, UpperBldRgstSeqno, MjrFmlyYn } =
        await this.getDtlOnly(
          aesKey,
          aesIv,
          BldRgstSeqNumber,
          UntClsfCd,
          headers,
          address,
        );

      console.log(RegstrKindCd, BldRgstSeqno, UpperBldRgstSeqno, MjrFmlyYn);

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

      const currentHour = await this.utilsService.getCurrentHour();
      console.log('현재 시간: ', currentHour);
      const rptcResp = await axios.post(this.RPTC_URL, rptcBody, { headers });
      const binaryBuffer = Buffer.from(rptcResp.data.Result.PdfData, 'base64');
      const filePath = `odocs${userId ? '/' + userId : ''}/${address}/bld-rgst`;
      const fileName = await this.utilsService.saveToPdf(
        filePath,
        address,
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

  SEARCH_ADDRESS_API_KEY = 'U01TX0FVVEgyMDIzMTEyOTE4NDE1MzExNDMyMDc=';
  SEARCH_API_ENDPOINT = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';
  async findAddressByKeywork(keyword: string): Promise<any> {
    const params = {
      confmKey: this.SEARCH_ADDRESS_API_KEY,
      countPerPage: '15',
      currentPage: '1',
      keyword,
      resultType: 'json',
    };
    const { data } = await axios.get(`${this.SEARCH_API_ENDPOINT}`, {
      params,
    });
    console.log(data.results.juso);
    if (data.results.common.errorMessage !== '정상') {
      throw new BadRequestException('정상적인 요청이 아닙니다.');
    }
    return data.results.juso;
  }

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

  private async getDtlOnly(
    aesKey,
    aesIv,
    BldRgstSeqNumber,
    UntClsfCd,
    headers,
    address,
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
      console.log(dtlResp.data.Result);
      // return 0;
      return this.filterResultsOnly(dtlResp.data.Result, address);
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

  private filterResultsOnly(results, address) {
    const resultJuso = results.find(
      (dtl) =>
        (dtl.DongNm &&
          dtl.HoNm &&
          address.includes(dtl.DongNm) &&
          address.includes(dtl.HoNm)) ||
        (!dtl.DongNm && dtl.HoNm && address.includes(dtl.HoNm)),
    );
    console.log('resultJuso', resultJuso);
    return resultJuso ? resultJuso : results[0];
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

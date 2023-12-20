import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Crypto from 'crypto';
import * as fs from 'fs';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';

@Injectable()
export class BldRgstService {
  private ENDPOINT: string;
  private API_KEY: string;
  private DTL_URL: string;
  private SEARCH_URL: string;
  private RPTC_URL: string;

  constructor(private readonly tilkoApiService: TilkoApiService) {
    this.ENDPOINT = process.env.TILKO_API_ENDPOINT;
    this.API_KEY = process.env.TILKO_API_KEY;
    this.DTL_URL = `${this.ENDPOINT}api/v2.0/EaisIdLogin/BldRgstDtl`;
    this.SEARCH_URL = `${this.ENDPOINT}api/v2.0/EaisIdLogin/BldRgstMst`;
    this.RPTC_URL = `${this.ENDPOINT}api/v2.0/EaisIdLogin/RPTCAA02R01`;
  }

  /* ---------------------------------------------------------- */
  async getBldRgst(
    addressType = '1',
    queryAddress: string,
    hoNm: string,
    dongNm: string,
    path = 'getBldRgst',
  ): Promise<string> {
    console.log('건축물대장 발급 시작 ======================>>');
    console.time('건축물대장 발급');
    try {
      console.log('getBldRgstMst');
      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);
      const bldRgstMstBody = {
        AddressType: addressType,
        QueryAddress: queryAddress,
      };
      const bldRgstMstResp = await axios
        .post(this.SEARCH_URL, bldRgstMstBody, { headers })
        .then((response) => response.data);

      if (bldRgstMstResp.Status !== 'OK') {
        console.log('bldRgstMstResp ERROR');
      }
      const { BldRgstSeqNumber, UntClsfCd } = bldRgstMstResp.Result[0];
      const { RegstrKindCd, BldRgstSeqno, UpperBldRgstSeqno, MjrFmlyYn } =
        await this.getDtl(
          aesKey,
          aesIv,
          BldRgstSeqNumber,
          UntClsfCd,
          headers,
          hoNm,
          dongNm,
        );

      const rptcBody = {
        Auth: {
          UserID: await this.tilkoApiService.aesEncrypt(
            aesKey,
            aesIv,
            'aresa01bryan',
          ),
          UserPassword: await this.tilkoApiService.aesEncrypt(
            aesKey,
            aesIv,
            '1q2w3e4r!',
          ),
        },
        PublishType: 0,
        RegstrKindCd,
        UpperBldRgstSeqno: UpperBldRgstSeqno || '',
        BldRgstSeqno,
        UntClsfCd,
        MjrFmlyYn,
      };

      const rptcResp = await axios
        .post(this.RPTC_URL, rptcBody, { headers })
        .then((response) => response.data)
        .catch((err) => {
          console.log(err);
        });
      // console.log('EaisIdLogin/RPTCAA02R01', rptcResp.Result);

      const binaryData = rptcResp.Result.PdfData;
      const binaryBuffer = Buffer.from(binaryData, 'base64');
      const current = await this.tilkoApiService.getCurrentTime();

      // 경로가 존재하지 않으면 생성
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });

      // const file = `${uniqueNoResult}_${current}.pdf`;
      const file = encodeURIComponent(`${queryAddress}_${current}.pdf`);
      const fileName = `${path}/${file}`;
      await fs.writeFileSync(fileName, binaryBuffer);

      console.timeEnd('건축물대장 발급');
      console.log('======================>> 건축물대장 발급 종료');
      return file;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  }

  /**
   * 외부 API를 사용하여 건물 등록 상세 정보를 조회합니다.
   * @param {string} aesKey - AES 키
   * @param {string} aesIv - AES 초기화 벡터
   * @param {string} BldRgstSeqNumber - 건물 등록 일련번호
   * @param {string} UntClsfCd - 단위 분류 코드
   * @param {Object} headers - HTTP 요청 헤더
   * @param {string} hoNm - 호 이름
   * @param {string} dongNm - 동 이름
   * @returns {Object|null} 조회된 상세 정보 또는 null
   */
  private async getDtl(
    aesKey,
    aesIv,
    BldRgstSeqNumber,
    UntClsfCd,
    headers,
    hoNm,
    dongNm,
  ) {
    const dtlBody = {
      Auth: {
        UserId: await this.tilkoApiService.aesEncrypt(
          aesKey,
          aesIv,
          'aresa01bryan',
        ),
        UserPassword: await this.tilkoApiService.aesEncrypt(
          aesKey,
          aesIv,
          '1q2w3e4r!',
        ),
      },
      BldRgstSeqNumber,
      UntClsfCd,
    };

    try {
      const dtlResp = await axios
        .post(this.DTL_URL, dtlBody, { headers })
        .then((response) => response.data);
      return this.filterResults(dtlResp.Result, dongNm, hoNm);
    } catch (error) {
      console.error('Error fetching details:', error);
      throw new Error('Details fetch failed.');
    }
  }

  /**
   * 결과를 필터링합니다.
   * @param {Array} results - 원본 결과 배열
   * @param {string} dongNm - 동 이름
   * @param {string} hoNm - 호 이름
   * @returns {Object|null} 필터링된 결과 또는 null
   */
  private filterResults(results, dongNm, hoNm) {
    if (dongNm && hoNm) {
      return (
        results.find(
          (dtl) =>
            dtl.DongNm &&
            dtl.HoNm &&
            dtl.DongNm.includes(dongNm.replace(/[^0-9]/g, '')) &&
            dtl.HoNm.includes(hoNm.replace(/[^0-9]/g, '')),
        ) || null
      );
    }
    if (!dongNm && hoNm) {
      return (
        results.find(
          (dtl) => dtl.HoNm && dtl.HoNm.includes(hoNm.replace(/[^0-9]/g, '')),
        ) || null
      );
    }
    return results[0];
  }
}

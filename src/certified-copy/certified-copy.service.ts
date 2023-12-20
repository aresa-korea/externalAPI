import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Crypto from 'crypto';
import * as fs from 'fs';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';

@Injectable()
export class CertifiedCopyService {
  private ENDPOINT: string;
  private UNIQUE_NO_URL: string;
  private CERTIFIED_INFO_URL: string;
  private MAKE_PDF_URL: string;

  private readonly IROS_ID = 'lg7121';
  private readonly IROS_PASSWD = '158Rotc5@';
  private readonly EMONEY_PREFIX = 'L4339863';
  private readonly EMONEY_SUFFIX = '1788';
  private readonly EMONEY_PASSWD = 'aresa1';

  constructor(private readonly tilkoApiService: TilkoApiService) {
    this.ENDPOINT = process.env.TILKO_API_ENDPOINT;
    this.UNIQUE_NO_URL = `${this.ENDPOINT}api/v1.0/Iros/RISUConfirmSimpleC`;
    this.CERTIFIED_INFO_URL = `${this.ENDPOINT}api/v1.0/iros/risuretrieve`;
    this.MAKE_PDF_URL = `${this.ENDPOINT}api/v1.0/iros/getpdffile`;
  }

  async getCertifiedCopy(
    address: string,
    path = 'certified-copy',
  ): Promise<any> {
    console.log('등기부등본 발급 시작 ======================>>');
    console.time('등기부등본 발급');
    try {
      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);

      const getUniqueNoOptions = {
        Address: address,
        Sangtae: '2',
        KindClsFlag: '0',
        Region: '0',
        Page: '1',
      };

      console.time('getUniqueNoResp');
      const getUniqueNoResp = await axios
        .post(this.UNIQUE_NO_URL, getUniqueNoOptions, { headers })
        .then((response) => response.data);
      console.timeEnd('getUniqueNoResp');

      if (getUniqueNoResp.ErrorCode === 0 && getUniqueNoResp.ResultList[0]) {
        const certifiedInfoOptions = await this.makeCertifiedInfoOption(
          aesKey,
          aesIv,
          getUniqueNoResp.ResultList[0].UniqueNo,
        );

        console.time('certifiedInfo');
        const certifiedInfo = await axios
          .post(this.CERTIFIED_INFO_URL, certifiedInfoOptions, { headers })
          .then((response) => response.data);
        console.timeEnd('certifiedInfo');

        // PDF 생성 API
        console.time('pdfRespData');
        const makePdfOptions = {
          TransactionKey: certifiedInfo.TransactionKey, // 등본발급 시 리턴받은 트랜잭션 키 (GUID)
          IsSummary: 'Y', // 요약 데이터 표시 여부 (Y/N 빈 값 또는 기본값 Y인 경우)
        };
        const pdfRespData = await axios
          .post(this.MAKE_PDF_URL, makePdfOptions, { headers })
          .then((response) => response.data);
        console.timeEnd('pdfRespData');

        // 바이너리 파일 저장
        const binaryData = pdfRespData.Message;
        const binaryBuffer = Buffer.from(binaryData, 'base64');
        const current = await this.tilkoApiService.getCurrentTime();

        // 경로가 존재하지 않으면 생성
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });

        // const file = `${uniqueNoResult}_${current}.pdf`;
        const file = encodeURIComponent(`${address}_${current}.pdf`);
        const fileName = `${path}/${file}`;
        await fs.writeFileSync(fileName, binaryBuffer);

        const result = {
          Status: 200,
          Message: '파일이 생성되었습니다.',
          TargetMessage: '파일이 생성되었습니다.',
          FileName: fileName, // 파일의 경로를 포함
        };

        console.timeEnd('등기부등본 발급');
        console.log('======================>> 등기부등본 발급 종료');
        return result;
      } else {
        const result = {
          Status: getUniqueNoResp.Status,
          Message: getUniqueNoResp.Message,
          TargetMessage: getUniqueNoResp.TargetMessage,
        };
        return result;
      }
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  }

  private async makeCertifiedInfoOption(aesKey, aesIv, uniqueNo) {
    return {
      IrosID: await this.tilkoApiService.aesEncrypt(
        aesKey,
        aesIv,
        this.IROS_ID,
      ), // [암호화] iros.go.kr 로그인 아이디 (Base64 인코딩)
      IrosPwd: await this.tilkoApiService.aesEncrypt(
        aesKey,
        aesIv,
        this.IROS_PASSWD,
      ), // [암호화] iros.go.kr 로그인 비밀번호 (Base64 인코딩)
      EmoneyNo1: await this.tilkoApiService.aesEncrypt(
        aesKey,
        aesIv,
        this.EMONEY_PREFIX,
      ), // [암호화] 전자결제 선불카드의 처음 8자리 (Base64 인코딩)
      EmoneyNo2: await this.tilkoApiService.aesEncrypt(
        aesKey,
        aesIv,
        this.EMONEY_SUFFIX,
      ), // [암호화] 전자결제 선불카드의 마지막 4자리 (Base64 인코딩)
      EmoneyPwd: await this.tilkoApiService.aesEncrypt(
        aesKey,
        aesIv,
        this.EMONEY_PASSWD,
      ), // [암호화] 전자결제 선불카드 비밀번호 (Base64 인코딩)
      UniqueNo: uniqueNo, // 부동산 식별 번호 (14자리, '-' 제외)
      JoinYn: 'Y', // 공동 담보/전세 목록 추출 여부 (기본값 N, Y/N 빈 값 또는 다른 문자열인 경우)
      CostsYn: 'N', // 거래 목록 추출 여부 (기본값 N, Y/N 빈 값 또는 다른 문자열인 경우)
      DataYn: 'N', // 계산 폐쇄 추출 여부 (기본값 N, Y/N 빈 값 또는 다른 문자열인 경우)
      ValidYn: 'Y', // 유효한 것만 포함 여부 (기본값 N, Y/N 빈 값 또는 다른 문자열인 경우)
      IsSummary: 'Y', // 요약 데이터 표시 여부 (Y/N 빈 값 또는 기본값 Y인 경우)
    };
  }
}

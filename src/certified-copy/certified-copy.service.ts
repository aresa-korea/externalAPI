import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Crypto from 'crypto';
import { TilkoApiService } from 'src/tilko-api/tilko-api.service';
import { UtilsService } from 'src/utils/utils.service';

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

  constructor(
    private readonly tilkoApiService: TilkoApiService,
    private readonly utilsService: UtilsService,
  ) {
    this.ENDPOINT = process.env.TILKO_API_ENDPOINT;
    this.UNIQUE_NO_URL = `${this.ENDPOINT}api/v1.0/Iros/RISUConfirmSimpleC`;
    this.CERTIFIED_INFO_URL = `${this.ENDPOINT}api/v1.0/iros/risuretrieve`;
    this.MAKE_PDF_URL = `${this.ENDPOINT}api/v1.0/iros/getpdffile`;
  }

  gatAddressMakeOption(address: string) {
    const addresses = address.split(' ');
    const findAddresses = addresses.find((address) => address.includes('('));
    if (findAddresses) {
      const fIndex = addresses.indexOf(findAddresses);

      let cAddr = findAddresses;
      cAddr = cAddr.replace('A', '에이');
      cAddr = cAddr.replace('a', '에이');
      cAddr = cAddr.replace('B', '비이');
      cAddr = cAddr.replace('b', '비이');
      cAddr = cAddr.replace('C', '씨이');
      cAddr = cAddr.replace('c', '씨이');
      cAddr = cAddr.replace('D', '디이');
      cAddr = cAddr.replace('d', '디이');
      cAddr = cAddr.replace('E', '이이');
      cAddr = cAddr.replace('e', '이이');

      // findAddress를 address 원래 자리에 넣는다.

      if (cAddr.includes('(')) {
        cAddr = cAddr.replace(/\(/g, ' ');
      }

      if (cAddr.includes(')')) {
        cAddr = !cAddr.includes(')동')
          ? cAddr.replace(/\)/g, '동')
          : cAddr.replace(/\)/g, '');
      } else {
        if (!cAddr.includes('동')) {
          cAddr = cAddr + '동';
        }
      }

      addresses[fIndex] = cAddr;
      address = addresses.join(' ');
    }

    return address;
  }

  getRegionNumber(address: string) {
    const region = address.split(' ')[0];
    let regionNumber = '0';

    switch (region) {
      case '서울특별시':
        regionNumber = '1';
        break;
      case '부산광역시':
        regionNumber = '2';
        break;
      case '대구광역시':
        regionNumber = '3';
        break;
      case '인천광역시':
        regionNumber = '4';
        break;
      case '광주광역시':
        regionNumber = '5';
        break;
      case '대전광역시':
        regionNumber = '6';
        break;
      case '울산광역시':
        regionNumber = '7';
        break;
      case '세종특별자치시':
        regionNumber = '8';
        break;
      case '경기도':
        regionNumber = '9';
        break;
      case '강원도':
        regionNumber = '10';
        break;
      case '충청북도':
        regionNumber = '11';
        break;
      case '충청남도':
        regionNumber = '12';
        break;
      case '전라북도':
        regionNumber = '13';
        break;
      case '전라남도':
        regionNumber = '14';
        break;
      case '경상북도':
        regionNumber = '15';
        break;
      case '경상남도':
        regionNumber = '16';
        break;
      case '제주특별자치도':
        regionNumber = '17';
        break;
      default:
        regionNumber = '0';
        break;
    }

    return regionNumber;
  }

  async getUniqueNo(
    address: string,
    sangtae: string,
    kindClsFlag: string,
  ): Promise<any> {
    this.utilsService.startProcess('건물 고유 번호 발급');
    const aesKey = Crypto.randomBytes(16);
    const headers = await this.tilkoApiService.getCommonHeader(aesKey);

    const requestAddress = address.includes('(')
      ? this.gatAddressMakeOption(address)
      : address;

    console.log('address', address);
    console.log('requestAddress', requestAddress);
    /**
     * @param Sangtae 등기상태
     * @type String
     * 0: 현행 / 1: 폐쇄 / 2: 현행폐쇄
     *
     * @param KindClsFlag (부동산 구분)
     * @type String
     * 0: 전체, 1: 집합건물, 2: 건물, 3: 토지)
     *
     * @param Region 검색할 지역
     * @type String
     * 전체:0/서울특별시:1/부산광역시:2/대구광역시:3
     * /인천광역시:4/광주광역시:5/대전광역시:6/울산광역시:7
     * /세종특별자치시:8/경기도:9/강원도:10/충청북도:11
     * /충청남도:12/전라북도:13/전라남도:14/경상북도:15
     * /경상남도:16/제주특별자치도:17)
     */

    const uniqueNoOptions = {
      Address: requestAddress,
      Sangtae: sangtae,
      KindClsFlag: kindClsFlag,
      Region: this.getRegionNumber(address),
      Page: '1',
    };
    console.log(uniqueNoOptions);

    console.time('getUniqueNoResp');
    const { data } = await axios.post(this.UNIQUE_NO_URL, uniqueNoOptions, {
      headers,
    });
    console.timeEnd('getUniqueNoResp');
    console.log(data);
    if (data.ResultList.length === 0) {
      this.utilsService.startProcess('영문 포함 건물 고유 번호 재발급');
      // A동을 에이동으로
      // B동을 비동으로
      // 주소가 '서울특별시 강남구 봉은사로 37길 23 동광팰리스 B동 302로 오는데, 여기서 B동을 비동으로 바꿔야함
      // 이때 대소문자 상관없이 b든 B든 비로 바꿔야함
      let changeAddress = requestAddress;
      changeAddress = changeAddress.replace('A', '에이');
      changeAddress = changeAddress.replace('B', '비');
      changeAddress = changeAddress.replace('C', '시');
      changeAddress = changeAddress.replace('D', '디');
      changeAddress = changeAddress.replace('E', '이');
      changeAddress = changeAddress.replace('F', '에프');
      changeAddress = changeAddress.replace('G', '지');
      changeAddress = changeAddress.replace('H', '에이치');
      changeAddress = changeAddress.replace('I', '아이');
      changeAddress = changeAddress.replace('J', '제이');
      changeAddress = changeAddress.replace('K', '케이');
      changeAddress = changeAddress.replace('L', '엘');
      changeAddress = changeAddress.replace('M', '엠');
      changeAddress = changeAddress.replace('N', '엔');
      changeAddress = changeAddress.replace('O', '오');
      changeAddress = changeAddress.replace('P', '피');
      changeAddress = changeAddress.replace('a', '에이');
      changeAddress = changeAddress.replace('b', '비');
      changeAddress = changeAddress.replace('c', '시');
      changeAddress = changeAddress.replace('d', '디');
      changeAddress = changeAddress.replace('e', '이');
      changeAddress = changeAddress.replace('f', '에프');
      changeAddress = changeAddress.replace('g', '지');
      changeAddress = changeAddress.replace('h', '에이치');
      changeAddress = changeAddress.replace('i', '아이');
      changeAddress = changeAddress.replace('j', '제이');
      changeAddress = changeAddress.replace('k', '케이');
      changeAddress = changeAddress.replace('l', '엘');
      changeAddress = changeAddress.replace('m', '엠');
      changeAddress = changeAddress.replace('n', '엔');
      changeAddress = changeAddress.replace('o', '오');
      changeAddress = changeAddress.replace('p', '피');

      const uniqueNoOptions = {
        Address: changeAddress,
        Sangtae: sangtae,
        KindClsFlag: kindClsFlag,
        Region: this.getRegionNumber(address),
        Page: '1',
      };
      console.log(uniqueNoOptions);

      console.time('getUniqueNoResp');
      const { data } = await axios.post(this.UNIQUE_NO_URL, uniqueNoOptions, {
        headers,
      });
      console.timeEnd('getUniqueNoResp');
      console.log(data);

      this.utilsService.endProcess('영문 포함 건물 고유 번호 재발급');
      return data;
    }
    this.utilsService.endProcess('건물 고유 번호 발급');
    return data;
  }

  async getCertifiedCopy(
    uniqueNoRes: any,
    filePath: string,
    saveFileName: string,
    type: string,
  ): Promise<any> {
    this.utilsService.startProcess('등기부등본 발급');

    try {
      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);

      const data = uniqueNoRes;

      if (data.PointBalance < 10000) {
        this.utilsService.sendEmail(
          'aresa01.bryan@aresa.io',
          '포인트 부족 알림',
          `포인트가 부족합니다. 현재 포인트: ${data.PointBalance}`,
        );
      }

      if (data.ErrorCode === 0 && data.ResultList[0]) {
        const certifiedInfoOptions = await this.makeCertifiedInfoOption(
          aesKey,
          aesIv,
          data.ResultList[0].UniqueNo,
        );

        console.time('certifiedInfo');
        const certifiedInfoResp = await axios.post(
          this.CERTIFIED_INFO_URL,
          certifiedInfoOptions,
          { headers },
        );
        const certifiedInfo = certifiedInfoResp.data;
        console.timeEnd('certifiedInfo');

        if (!certifiedInfo.TransactionKey) {
          this.utilsService.endProcess('등기부등본 발급');

          return {
            Status: certifiedInfo.Status,
            Message: certifiedInfo.Message,
            ErrorCode: certifiedInfo.ErrorCode,
            TargetCode: certifiedInfo.TargetCode,
            TargetMessage: certifiedInfo.TargetMessage,
          };
        }

        // PDF 생성 API
        console.time('pdfRespData');
        const makePdfOptions = {
          TransactionKey: certifiedInfo.TransactionKey, // 등본발급 시 리턴받은 트랜잭션 키 (GUID)
          IsSummary: 'Y', // 요약 데이터 표시 여부 (Y/N 빈 값 또는 기본값 Y인 경우)
        };
        const pdfRespDataResp = await axios.post(
          this.MAKE_PDF_URL,
          makePdfOptions,
          { headers },
        );
        const pdfRespData = pdfRespDataResp.data;
        console.timeEnd('pdfRespData');

        // 바이너리 파일 저장
        const binaryBuffer = Buffer.from(pdfRespData.Message, 'base64');

        if (type === '1') {
          this.utilsService.endProcess('등기부등본 발급');
          return {
            Status: 200,
            Message: '바이너리가 생성되었습니다.',
            TargetMessage: '바이너리가 생성되었습니다.',
            binaryBuffer: binaryBuffer, // 파일의 경로를 포함
          };
        }

        // 경로가 존재하지 않으면 생성
        const fileName = await this.utilsService.saveToPdf(
          filePath,
          saveFileName,
          binaryBuffer,
        );

        this.utilsService.endProcess('등기부등본 발급');
        return {
          Status: 200,
          Message: '파일이 생성되었습니다.',
          TargetMessage: '파일이 생성되었습니다.',
          FileName: fileName, // 파일의 경로를 포함
        };
      } else {
        this.utilsService.endProcess('등기부등본 발급');
        return {
          Status: data.Status,
          Message: data.Message,
          ErrorCode: data.ErrorCode,
          TargetCode: data.TargetCode,
          TargetMessage: data.TargetMessage,
        };
      }
    } catch (error) {
      this.utilsService.endProcess('등기부등본 발급');
      console.error('Error:', error.message);
      return {
        Status: 500,
        Message: 'Internal Server Error',
        Error: error.message,
      };
    }
  }

  async createFileBuildingCopy(
    uniqueId: any,
    address: string,
    userId: string,
  ): Promise<any> {
    this.utilsService.startProcess('등기부등본 발급');

    try {
      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const uniqueNo = uniqueId.replace(/-/g, '');
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);

      console.time('certifiedInfo');
      const certifiedInfoOptions = await this.makeCertifiedInfoOption(
        aesKey,
        aesIv,
        uniqueNo,
      );
      const certifiedInfo = await axios
        .post(this.CERTIFIED_INFO_URL, certifiedInfoOptions, { headers })
        .then((response) => response.data)
        .catch((e) => {
          console.timeEnd('certifiedInfo');
          console.log(e);
        });
      console.timeEnd('certifiedInfo');

      if (!certifiedInfo.TransactionKey) {
        this.utilsService.endProcess('등기부등본 발급');

        return {
          Status: certifiedInfo.Status,
          Message: certifiedInfo.Message,
          ErrorCode: certifiedInfo.ErrorCode,
          TargetCode: certifiedInfo.TargetCode,
          TargetMessage: certifiedInfo.TargetMessage,
        };
      }

      // PDF 생성 API
      console.time('pdfRespData');
      const makePdfOptions = {
        TransactionKey: certifiedInfo.TransactionKey, // 등본발급 시 리턴받은 트랜잭션 키 (GUID)
        IsSummary: 'Y', // 요약 데이터 표시 여부 (Y/N 빈 값 또는 기본값 Y인 경우)
      };
      const pdfRespData = await axios
        .post(this.MAKE_PDF_URL, makePdfOptions, {
          headers,
        })
        .then((response) => response.data)
        .catch((e) => {
          console.timeEnd('pdfRespData');
          console.log(e);
        });
      console.timeEnd('pdfRespData');

      const currentHour = await this.utilsService.getCurrentHour();
      console.log('현재 시간: ', currentHour);
      // 바이너리 파일 저장
      const binaryBuffer = Buffer.from(pdfRespData.Message, 'base64');
      const filePath = `odocs${
        userId ? '/' + userId : ''
      }/${address}/certified-copy`;

      console.log('다음 경로에 파일을 저장합니다. ', filePath);
      // 경로가 존재하지 않으면 생성
      const fileName = await this.utilsService.saveToPdfWithMin(
        filePath,
        address,
        binaryBuffer,
      );

      this.utilsService.endProcess('등기부등본 발급');
      return {
        Status: 200,
        Message: '파일이 생성되었습니다.',
        TargetMessage: '파일이 생성되었습니다.',
        FileName: fileName, // 파일의 경로를 포함
      };
    } catch (error) {
      this.utilsService.endProcess('등기부등본 발급');
      console.error('Error:', error.message);
      return {
        Status: 500,
        Message: 'Internal Server Error',
        Error: error.message,
      };
    }
  }

  async createFileLandCopy(
    uniqueId: any,
    address: string,
    userId: string,
  ): Promise<any> {
    this.utilsService.startProcess('토지등기 발급');

    try {
      const aesIv = Buffer.alloc(16, 0);
      const aesKey = Crypto.randomBytes(16);
      const uniqueNo = uniqueId.replace(/-/g, '');
      const headers = await this.tilkoApiService.getCommonHeader(aesKey);

      console.time('certifiedInfo');
      const certifiedInfoOptions = await this.makeCertifiedInfoOption(
        aesKey,
        aesIv,
        uniqueNo,
      );
      const certifiedInfo = await axios
        .post(this.CERTIFIED_INFO_URL, certifiedInfoOptions, { headers })
        .then((response) => response.data)
        .catch((e) => {
          console.timeEnd('certifiedInfo');
          console.log(e);
        });
      console.timeEnd('certifiedInfo');

      if (!certifiedInfo.TransactionKey) {
        this.utilsService.endProcess('토지등기 발급');

        return {
          Status: certifiedInfo.Status,
          Message: certifiedInfo.Message,
          ErrorCode: certifiedInfo.ErrorCode,
          TargetCode: certifiedInfo.TargetCode,
          TargetMessage: certifiedInfo.TargetMessage,
        };
      }

      // PDF 생성 API
      console.time('pdfRespData');
      const makePdfOptions = {
        TransactionKey: certifiedInfo.TransactionKey, // 등본발급 시 리턴받은 트랜잭션 키 (GUID)
        IsSummary: 'Y', // 요약 데이터 표시 여부 (Y/N 빈 값 또는 기본값 Y인 경우)
      };
      const pdfRespData = await axios
        .post(this.MAKE_PDF_URL, makePdfOptions, {
          headers,
        })
        .then((response) => response.data)
        .catch((e) => {
          console.timeEnd('pdfRespData');
          console.log(e);
        });
      console.timeEnd('pdfRespData');

      const currentHour = await this.utilsService.getCurrentHour();
      console.log('현재 시간: ', currentHour);
      // 바이너리 파일 저장
      const binaryBuffer = Buffer.from(pdfRespData.Message, 'base64');
      const filePath = `odocs${
        userId ? '/' + userId : ''
      }/${address}/land-copy`;

      console.log('다음 경로에 파일을 저장합니다. ', filePath);
      // 경로가 존재하지 않으면 생성
      const fileName = await this.utilsService.saveToPdfWithMin(
        filePath,
        address,
        binaryBuffer,
      );

      this.utilsService.endProcess('토지등기 발급');
      return {
        Status: 200,
        Message: '파일이 생성되었습니다.',
        TargetMessage: '파일이 생성되었습니다.',
        FileName: fileName, // 파일의 경로를 포함
      };
    } catch (error) {
      this.utilsService.endProcess('토지등기 발급');
      console.error('Error:', error.message);
      return {
        Status: 500,
        Message: 'Internal Server Error',
        Error: error.message,
      };
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

  /**
   * 특정 건물의 pdf 파일 클라이언트로 리턴합니다.
   */
  async downloadCertifiedCopy(directory: string, response): Promise<any> {
    try {
      return this.utilsService.getFileDownload(directory, response);
    } catch (error) {
      console.error('Error reading directory:', error);
      return []; // 디렉토리 읽기 실패 시 빈 배열 반환
    }
  }

  /**
   * 특정 건물의 pdf 파일 클라이언트로 리턴합니다.
   */
  async downloadLandCopy(directory: string, response): Promise<any> {
    try {
      return this.utilsService.getFileDownload(directory, response);
    } catch (error) {
      console.error('Error reading directory:', error);
      return []; // 디렉토리 읽기 실패 시 빈 배열 반환
    }
  }
}

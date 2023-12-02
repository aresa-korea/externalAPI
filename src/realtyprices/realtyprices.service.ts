import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { readFileSync } from 'fs';

@Injectable()
export class RealtypricesService {
  constructor() {
    // Add your constructor logic here
  }

  async getRealtyPrice(address: string): Promise<object> {
    const { sido, sigungu, dong, bunji, bldDong, bldHo } =
      await this.parsingAddress(address);
    console.log(sido, sigungu, dong, bunji, bldDong, bldHo);

    const bunList = bunji.split('-');
    console.log('번지 리스트', bunList);

    const { sidoCode, sigunguCode, dongCode } = await this.getRegionCode(
      sido,
      sigungu,
      dong,
    );
    const reg = sidoCode + sigunguCode;
    const eub = dongCode;

    console.log('시도시군구 동 코드', reg, eub);

    const { code, notice_date } = await this.getbldList(reg, eub, bunList);
    console.log('건물코드 :', code);

    const bldDongList = await this.getBldDongList(
      code,
      notice_date,
      reg,
      eub,
      bunList,
      bldDong,
    );
    console.log('건물 동 번호 :', bldDongList);
    if (!bldDongList) return { message: '해당하는 동이 없습니다.' };
    const bldDongCode = bldDongList.code;

    const bldHoList = await this.getBldHoList(
      code,
      notice_date,
      reg,
      eub,
      bunList,
      bldDongCode,
      bldHo,
    );
    console.log('건물 호 번호 :', bldHoList);
    if (!bldHoList) return { message: '해당하는 호가 없습니다.' };
    const bldHoCode = bldHoList.code;

    const realtyPriceList = await this.getRealtyPriceList(
      code,
      notice_date,
      reg,
      eub,
      bunList,
      bldDongCode,
      bldHoCode,
    );

    return realtyPriceList;
  }

  async getRealtyPriceList(
    code,
    notice_date,
    reg,
    eub,
    bunList,
    bldDongCode,
    bldHoCode,
  ): Promise<object> {
    const url = `https://www.realtyprice.kr/notice/search/townPriceListPastYearMap.search?page_no=1&reg_name=&sreg=&seub=&old_reg=&old_eub=&gbn=1&year=2023&notice_date=${notice_date}&notice_date_year=20230627&reg=${reg}&eub=${eub}&apt_name=&bun1=${bunList[0]
      }&bun2=${bunList[1] || '0'
      }&road_code=&initialword=&build_bun1=&build_bun2=&gbnApt=&apt_code=${code}&dong_code=${bldDongCode}&ho_code=${bldHoCode}&tabGbn=Text&full_addr_name=&dong_name=&ho_name=&notice_amt=&ktown_ho_seq=&print_yn=0&past_yn=&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=&capcha=&capcha_chk_yn=&recaptcha_token=`;

    const realtyPriceList = await axios
      .get(url)
      .then((response) => response.data.modelMap.list)
      .catch((error) => {
        console.log(error);
      });

    return { realtyPriceList };
  }

  async getBldHoList(
    code,
    notice_date,
    reg,
    eub,
    bunList,
    bldDongCode,
    bldHo,
  ): Promise<any> {
    const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=1&year=2023&notice_date=${notice_date}&notice_date_year=20231201&gbnApt=HO&road_reg=&road=&initialword=&build_bun1=&build_bun2=&reg=${reg}&eub=${eub}&apt_name=&bun1=${bunList[0]
      }&bun2=${bunList[1] || '0'
      }&apt_code=${code}&dong_code=${bldDongCode}&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=`;

    const bldHoList = await axios
      .get(url)
      .then((response) => response.data.modelMap.list)
      .catch((error) => {
        console.log(error);
      });

    // bldDong에 숫자가 있으면
    if (bldHo) {
      return bldHoList.find((item) => item.name === bldHo);
    }
    return { bldHoList };
  }

  async getBldDongList(
    code,
    notice_date,
    reg,
    eub,
    bunList,
    bldDong,
  ): Promise<any> {
    const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=1&year=2023&notice_date=${notice_date}&notice_date_year=20231201&gbnApt=DONG&road_reg=&road=&initialword=&build_bun1=&build_bun2=&reg=${reg}&eub=${eub}&apt_name=&bun1=${bunList[0]
      }&bun2=${bunList[1] || '0'
      }&apt_code=${code}&dong_code=&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=`;

    const bldDongList = await axios
      .get(url)
      .then((response) => response.data.modelMap.list)
      .catch((error) => {
        console.log(error);
      });

    // bldDong에 숫자가 있으면
    if (bldDong) {
      return bldDongList.find((item) => item.name === bldDong);
    }
    return { bldDongList };
  }
  async getbldList(reg, eub, bunList): Promise<any> {
    const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=1&year=2023&notice_date=&notice_date_year=20231201&gbnApt=&road_reg=&road=&initialword=&build_bun1=&build_bun2=&reg=${reg}&eub=${eub}&apt_name=&bun1=${bunList[0]
      }&bun2=${bunList[1] || '0'
      }&apt_code=&dong_code=&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=`;
    const bldList = await axios
      .get(url, {
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          Referer: 'https://www.realtyprice.kr/notice/town/nfSiteLink.htm',
          'Sec-Ch-Ua':
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Ch-Ua-Platform': 'Windows',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      .then((response) => response.data.modelMap.list[0])
      .catch((error) => {
        console.log(error);
      });
    console.log('bldList', bldList);
    return bldList;
  }

  getRegionCode = async (sido, sigungu, dong): Promise<any> => {
    const koreaData = JSON.parse(readFileSync('./data/korea.json', 'utf8'));

    const sidoData = koreaData.list.find((item) => item.name === sido);
    const sigunguData = sidoData.sigungu.find((item) => item.name === sigungu);
    const dongData = sigunguData.gugun.find((item) => item.name === dong);

    const sidoCode = sidoData.code;
    const sigunguCode = sigunguData.code;
    const dongCode = dongData.code;

    return { sidoCode, sigunguCode, dongCode };
  };

  async parsingAddress(address: string): Promise<Address> {
    const addressList = address.split(' ');
    const sido = addressList[0];
    const sigungu = addressList[1];
    const dong = addressList[2];
    const bunji = addressList[3];
    const bldDong = address.match(/\d+동/g)[0]?.slice(0, -1) || '';
    const bldHo = address.match(/\d+호/g)[0]?.slice(0, -1) || '';

    return { sido, sigungu, dong, bunji, bldDong, bldHo };
  }
}

interface Address {
  sido: string;
  sigungu: string;
  dong: string;
  bunji: string;
  bldDong: string;
  bldHo: string;
}

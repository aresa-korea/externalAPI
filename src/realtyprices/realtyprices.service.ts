import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';

@Injectable()
export class RealtypricesService {
  constructor() {
    // Add your constructor logic here
  }

  async makeBldInfoJson(): Promise<object> {
    const roadCodeJson = JSON.parse(
      readFileSync('./data/roadCode.json', 'utf8'),
    );
    const notice_date_year = await this.getNoticeDateYear();

    const sidoList = roadCodeJson.list[0];
    const sigunguList = sidoList.list;

    console.log(sigunguList.length);

    // for (let i = 0; i < sigunguList.length; i++) {
    const i = 1;
    const searchCodeList = sigunguList[i].list;

    for (let j = 0; j < searchCodeList.length; j++) {
      const roadCodeList = searchCodeList[j].list;

      for (let k = 0; k < roadCodeList.length; k++) {
        const sidoCode = sidoList.code;
        const sigunguCode = sigunguList[i].code;
        const searchCode = searchCodeList[j].code;
        const roadCode = roadCodeList[k].code;

        const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=0&year=2023&notice_date=&notice_date_year=${notice_date_year}&gbnApt=&road_reg=${
          sidoCode + sigunguCode
        }&road=${roadCode}&initialword=${searchCode}&build_bun1=&build_bun2=&reg=&eub=&apt_name=&bun1=&bun2=&apt_code=&dong_code=&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=1&searchGbnBunji=&searchGbnBunjiYear=`;

        const bldInfoList = await axios
          .get(url)
          .then((response) => response.data.modelMap.list)
          .catch((error) => {
            console.log(error);
          });

        console.log('bldInfoList', bldInfoList);

        roadCodeJson.list[0].list[i].list[j].list[k].list = bldInfoList;
      }
    }
    // }
    return { roadCodeJson };
  }

  async makeRoadAddrJson(): Promise<object> {
    const roadCodeJson = JSON.parse(
      readFileSync('./data/roadCode.json', 'utf8'),
    );

    console.log('시도', roadCodeJson.list[0].name);
    const sidoList = roadCodeJson.list[0];

    const sigunguList = sidoList.list;
    for (let i = 0; i < sigunguList.length; i++) {
      console.log('시군구', sigunguList[i]);
      const searchCodeList = sigunguList[i].list;

      for (let j = 0; j < searchCodeList.length; j++) {
        const searchCode = searchCodeList[j].code;
        const sidoCode = sidoList.code;
        const sigunguCode = sigunguList[i].code;

        console.log('시도시군구', sidoCode, sigunguCode);
        const url = `https://www.realtyprice.kr/notice/road/searchRoadTown.road?p_gbn=ROAD&p_sido=${
          sidoList.code
        }&p_sigungu=${
          sidoCode + sigunguCode
        }&p_initialword=${searchCode}&p_road=&sido=${sidoList.code}&sigungu=${
          sidoCode + sigunguCode
        }&initialword=${searchCode}&rdoCondiRoad=1&build_bun1=&build_bun2=&apt_name=`;

        console.log(url);
        const roadList = await axios
          .get(url)
          .then((response) => response.data.modelMap.list)
          .catch((error) => {
            console.log(error);
          });
        console.log('roadList', roadList);

        roadCodeJson.list[0].list[i].list[j].list = roadList;
        console.log(roadCodeJson);
      }
    }
    return { roadCodeJson };
  }

  async makeDongriJson(): Promise<object> {
    const koreaJson = JSON.parse(readFileSync('./data/jibun.json', 'utf8'));

    for (let i = 0; i < koreaJson.list.length; i++) {
      console.log('시도', koreaJson.list[i].name);
      const sidoList = koreaJson.list[i];

      for (let j = 0; j < sidoList.sigungu.length; j++) {
        const sigunguList = sidoList.sigungu[j];
        console.log(sigunguList);

        const url = `https://www.realtyprice.kr/notice/bjd/searchBjdTown.bjd?gubun=DONGRI&addr_gbn=&sido=${sidoList.code}&sgg=${sigunguList.code}&eub=&year=&sido_list=${sidoList.code}&sgg_list=${sigunguList.code}&rdoCondi=0&apt_name=&bun1=&bun2=`;
        console.log(url);

        const dongriList = await axios
          .get(url)
          .then((response) => response.data.modelMap.list)
          .catch((error) => {
            console.log(error);
          });
        // console.log('dongriList', dongriList);

        sigunguList.dongri = dongriList;
      }
    }

    writeFileSync('./data/jibun.json', JSON.stringify(koreaJson), 'utf8');
    return koreaJson;
  }

  async makeSigunguJson(): Promise<object> {
    const koreaJson = JSON.parse(readFileSync('./data/jibun.json', 'utf8'));

    for (let i = 0; i < koreaJson.list.length; i++) {
      console.log('시도', koreaJson.list[i].name);
      const sidoList = koreaJson.list[i];

      const url = `https://www.realtyprice.kr/notice/bjd/searchBjdTown.bjd?gubun=SIGUNGU&addr_gbn=&sido=${sidoList.code}&sgg=&eub=&year=&sido_list=${sidoList.code}&rdoCondi=0&apt_name=&bun1=&bun2=`;
      // const url = `https://www.realtyprice.kr/notice/road/searchRoadTown.road?p_gbn=SIGUNGU&p_sido=${sidoList.code}&p_sigungu=&p_initialword=&p_road=&sido=${sidoList.code}&rdoCondiRoad=1&build_bun1=&build_bun2=&apt_name=`;

      console.log(url);
      const sigunguList = await axios
        .get(url)
        .then((response) => response.data.modelMap.list)
        .catch((error) => {
          console.log(error);
        });
      // console.log('sigunguList', sigunguList);

      koreaJson.list[i].sigungu = sigunguList;
    }

    writeFileSync('./data/jibun.json', JSON.stringify(koreaJson), 'utf8');
    return koreaJson;
  }

  async getRealtyPrice({ fullCode, bunji, dongName, hoName }): Promise<object> {
    console.log(fullCode, bunji, dongName, hoName);

    const bunList = bunji.split('-');
    console.log('번지 리스트', bunList);

    const reg = fullCode.slice(0, 5);
    const eub = fullCode.slice(5, 10);

    console.log('시도시군구, 동리 코드', reg, eub);

    const { code, notice_date } = await this.getbldList(reg, eub, bunList);
    console.log('건물코드 :', code);
    if (!code) return { message: '해당하는 건물 정보가 없습니다.' };

    const bldDongList = await this.getBldDongList(
      code,
      notice_date,
      reg,
      eub,
      bunList,
      dongName,
    );
    console.log('건물 동 번호 :', bldDongList);
    if (!bldDongList) return { message: '해당하는 동 정보가 없습니다.' };
    const bldDongCode = bldDongList.code;

    const bldHoList = await this.getBldHoList(
      code,
      notice_date,
      reg,
      eub,
      bunList,
      bldDongCode,
      hoName,
    );
    console.log('건물 호 번호 :', bldHoList);
    if (!bldHoList) return { message: '해당하는 호 정보가 없습니다.' };
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

  async getRealtyPriceWithAddress(address: string): Promise<object> {
    const { sido, sigungu, dongri, bunji, bldDong, bldHo } =
      await this.parsingAddress(address);
    console.log(sido, sigungu, dongri, bunji, bldDong, bldHo);

    const bunList = bunji.split('-');
    console.log('번지 리스트', bunList);

    const { sidoCode, sigunguCode, dongriCode } = await this.getRegionCode(
      sido,
      sigungu,
      dongri,
    );
    const reg = sidoCode + sigunguCode;
    const eub = dongriCode;

    console.log('시도시군구 동 코드', reg, eub);

    const { code, notice_date } = await this.getbldList(reg, eub, bunList);
    if (!code) return { message: '해당하는 건물이 없습니다.' };
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
    const blddongriCode = bldDongList.code;

    const bldHoList = await this.getBldHoList(
      code,
      notice_date,
      reg,
      eub,
      bunList,
      blddongriCode,
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
      blddongriCode,
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
    blddongriCode,
    bldHoCode,
  ): Promise<object> {
    const notice_date_year = await this.getNoticeDateYear();
    const url = `https://www.realtyprice.kr/notice/search/townPriceListPastYearMap.search?page_no=1&reg_name=&sreg=&seub=&old_reg=&old_eub=&gbn=1&year=2023&notice_date=${notice_date}&notice_date_year=${notice_date_year}&reg=${reg}&eub=${eub}&apt_name=&bun1=${
      bunList[0]
    }&bun2=${
      bunList[1] || '0'
    }&road_code=&initialword=&build_bun1=&build_bun2=&gbnApt=&apt_code=${code}&dong_code=${blddongriCode}&ho_code=${bldHoCode}&tabGbn=Text&full_addr_name=&dong_name=&ho_name=&notice_amt=&ktown_ho_seq=&print_yn=0&past_yn=&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=&capcha=&capcha_chk_yn=&recaptcha_token=`;

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
    blddongriCode,
    bldHo,
  ): Promise<any> {
    const notice_date_year = await this.getNoticeDateYear();
    const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=1&year=2023&notice_date=${notice_date}&notice_date_year=${notice_date_year}&gbnApt=HO&road_reg=&road=&initialword=&build_bun1=&build_bun2=&reg=${reg}&eub=${eub}&apt_name=&bun1=${
      bunList[0]
    }&bun2=${
      bunList[1] || '0'
    }&apt_code=${code}&dong_code=${blddongriCode}&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=`;

    const bldHoList = await axios
      .get(url)
      .then((response) => response.data.modelMap.list)
      .catch((error) => {
        console.log(error);
      });

    // bldHo에 숫자가 있으면
    if (bldHo) {
      return bldHoList.find((item) => item.name.includes(bldHo));
    }
    return { bldHoList };
  }

  async getNoticeDateYear(): Promise<string> {
    const today = new Date();
    return (
      today.getFullYear() + '' + (today.getMonth() + 1) + '' + today.getDate()
    );
  }

  async getBldDongList(
    code,
    notice_date,
    reg,
    eub,
    bunList,
    bldDong,
  ): Promise<any> {
    const notice_date_year = await this.getNoticeDateYear();
    const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=1&year=2023&notice_date=${notice_date}&notice_date_year=${notice_date_year}&gbnApt=DONG&road_reg=&road=&initialword=&build_bun1=&build_bun2=&reg=${reg}&eub=${eub}&apt_name=&bun1=${
      bunList[0]
    }&bun2=${
      bunList[1] || '0'
    }&apt_code=${code}&dong_code=&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=`;

    const bldDongList = await axios
      .get(url)
      .then((response) => response.data.modelMap.list)
      .catch((error) => {
        console.log(error);
      });

    // bldDong에 숫자가 있으면
    if (bldDong) {
      return bldDongList.find((item) => item.name.includes(bldDong));
    }
    return { bldDongList };
  }
  async getbldList(reg, eub, bunList): Promise<any> {
    const notice_date_year = await this.getNoticeDateYear();
    const url = `https://www.realtyprice.kr/notice/search/searchApt.search?gbn=1&year=2023&notice_date=&notice_date_year=${notice_date_year}&gbnApt=&road_reg=&road=&initialword=&build_bun1=&build_bun2=&reg=${reg}&eub=${eub}&apt_name=&bun1=${
      bunList[0]
    }&bun2=${
      bunList[1] || '0'
    }&apt_code=&dong_code=&ho_code=&past_yn=1&init_gbn=N&searchGbnRoad=&searchGbnBunji=1&searchGbnBunjiYear=`;
    // console.log(url);

    const bldList = await axios
      .get(url)
      .then((response) => response.data.modelMap.list)
      .catch((error) => {
        console.log(error);
      });

    console.log('bldList', bldList);
    return bldList ? bldList[0] : { code: '', notice_date: '' };
  }

  getRegionCode = async (sido, sigungu, dongri): Promise<any> => {
    const koreaData = JSON.parse(readFileSync('./data/jibun.json', 'utf8'));

    const sidoData = koreaData.list.find((item) => item.name === sido);
    const sigunguData = sidoData.sigungu.find((item) => item.name === sigungu);
    const dongriData = sigunguData.dongri.find((item) => item.name === dongri);

    const sidoCode = sidoData.code;
    const sigunguCode = sigunguData.code;
    const dongriCode = dongriData.code;

    return { sidoCode, sigunguCode, dongriCode };
  };

  async parsingAddress(address: string): Promise<Address> {
    console.log(address);
    const addressList = address.split(' ');
    const sido = addressList.shift();
    const sigungu = addressList.shift();
    console.log(addressList);
    const dongri = addressList[2] || '';
    const bunji = addressList[3] || '';
    console.log('bunji', bunji);
    const isBldDong = address.match(/([가-힣]+동)/);
    const bldDong = isBldDong ? isBldDong[0].slice(0, -1) : '';
    console.log('bldDong', bldDong);
    const isBldHo = address.match(/([가-힣]+호)/);
    const bldHo = isBldHo ? isBldHo[0].slice(0, -1) : '';
    console.log('bldHo', bldHo);

    return { sido, sigungu, dongri, bunji, bldDong, bldHo };
  }
}

interface Address {
  sido: string;
  sigungu: string;
  dongri: string;
  bunji: string;
  bldDong: string;
  bldHo: string;
}

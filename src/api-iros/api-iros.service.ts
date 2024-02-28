import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as iconv from 'iconv-lite';
import { UtilsService } from 'src/utils/utils.service';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ApiIrosService {
  private axiosInstance: AxiosInstance;

  private readonly IROS_ID = 'lg7121';
  private readonly IROS_PASSWD = '158Rotc5@';
  private WMONID;
  private JSESSION_VALUE;
  private RE1JESSION_VALUE;

  constructor(
    private httpService: HttpService,
    private utilsService: UtilsService,
  ) {
    this.axiosInstance = axios.create({
      headers: {
        'Content-Type': 'text/html; charset=MS949',
        // 기타 필요한 헤더
      },
    });

    this.axiosInstance.interceptors.request.use((config: any) => {
      config.headers['Cookie'] =
        `WMONID=${this.WMONID}; JSESSIONID=${this.JSESSION_VALUE};RE1JESSIONID=${this.RE1JESSION_VALUE}`;
      console.log(config.headers);
      return config;
    });

    // this.httpService.axiosRef.interceptors.request.use(
    //   (config: any) => {
    //     // config.headers['Cookie'] =
    //     //   `WMONID=${this.WMONID}; ${this.SESSION_NAME}=${this.SESSION_VALUE}`;
    //     config.headers['Cookie'] =
    //       `WMONID=${this.WMONID}; JSESSIONID=${this.JSESSION_VALUE}`;
    //     config.headers['Content-Type'] = 'text/html; charset=MS949';
    //     console.log(config.headers);
    //     return config;
    //   },
    //   (error) => {
    //     // Do something with request error here
    //     console.error('Error in request: ', error);
    //     return Promise.reject(error);
    //   },
    // );
  }

  async realLogin(): Promise<any> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://www.iros.go.kr/re1/intro.jsp');

    try {
      await page.type('#user_id', this.IROS_ID);
      await page.type('#password', this.IROS_PASSWD);
      await page.click('.login.mt4 > a');

      await page.waitForNavigation(); // 페이지 로딩이 완료될 때까지 기다립니다.

      console.log(page);
    } catch (error) {
      console.error('Error in login process:', error);
    }

    const cookies = await page.cookies();
    console.log(cookies);

    const cookieArray =
      cookies?.map((cookie) => {
        const [name, value] = String(cookie).split(';')[0].split('=');
        return { name, value };
      }) || [];
    this.WMONID = cookieArray.find((cookie) => cookie.name === 'WMONID')?.value;
    this.RE1JESSION_VALUE = cookieArray.find(
      (cookie) => cookie.name === 'RE1JESSIONID',
    )?.value;

    return { WMONID: this.WMONID, RE1JESSIONID: this.RE1JESSION_VALUE };
  }
  async loginTest(): Promise<any> {
    // const loginResp = this.httpService
    //   .post(
    //     'http://www.iros.go.kr/pos1/pfrontservlet?cmd=PMEMLoginC&q=CBF050388DCE00CF104898091113902098DBBB6645A589;8bfGp/aaC00xKzBYTpAt2w%3D%3D;OhLTYFEiqi0EsOiZrWKSSdIrR0Y%3D&charset=MS949',
    //     {
    //       user_id: this.IROS_ID,
    //       password: this.IROS_PASSWD,
    //     },
    //     {
    //       headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //       },
    //     },
    //   )
    //   .toPromise();
    // const response = await loginResp;
    // const cookies = response.headers['set-cookie'];
    // console.log(cookies);
    // const parsedCookies = cookies.reduce((acc, cookie) => {
    //   const [name, value] = cookie.split(';')[0].split('=');
    //   acc[name] = value;
    //   return acc;
    // }, {});

    return axios
      .get('http://www.iros.go.kr/frontservlet?cmd=RISUWelcomeViewC', {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
        },
      })
      .then((response) => {
        const cookies = response.headers['set-cookie'];
        return (
          cookies?.map((cookie) => {
            const [name, value] = cookie.split(';')[0].split('=');
            return { name, value };
          }) || []
        );
      })
      .then((cookieArray) => {
        const WMONID = cookieArray.find((cookie) => cookie.name === 'WMONID')
          ?.value;
        const JSESSIONID = cookieArray.find(
          (cookie) => cookie.name === 'JSESSIONID',
        )?.value;

        return { WMONID, JSESSIONID };
      });
  }

  eucKrPercentEncode(str) {
    let percentEncodedStr = '';
    for (let i = 0; i < str.length; i++) {
      // 문자열에서 문자를 추출
      const char = str[i];
      // 문자가 숫자인지 확인
      if (!/^[0-9]+$/.test(char)) {
        // 숫자가 아닌 경우 EUC-KR로 변환하여 percentEncodedStr에 추가
        const buffer = iconv.encode(char, 'EUC-KR');
        for (let j = 0; j < buffer.length; j++) {
          const hex = buffer[j].toString(16).toUpperCase();
          percentEncodedStr += '%' + (hex.length === 1 ? '0' + hex : hex);
        }
      } else {
        // 숫자인 경우 변환하지 않고 그대로 추가
        percentEncodedStr += char;
      }
    }
    return percentEncodedStr;
  }

  private baseURL = 'http://www.iros.go.kr/frontservlet'; // 기본 URL

  private async login(url, username, password) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);

    try {
      // await page.waitForSelector('.login.mt4'); // 로그인 버튼이 로드될 때까지 기다립니다.
      // await page.type('#user_id', username);
      // await page.type('#password', password);
      // await page.click('.login.mt4 > a');

      await page.waitForSelector('.id_pw'); // 로그인 버튼이 로드될 때까지 기다립니다.
      await page.type('#id_user_id', username);
      await page.type('#password', password);
      await page.click('.id_pw a');

      // await page.waitForNavigation(); // 페이지 로딩이 완료될 때까지 기다립니다.
    } catch (error) {
      console.error('Error in login process:', error);
    }

    const cookies = await page.cookies();
    await browser.close();
    return cookies;
  }

  public async getSampleHistory(
    a105pin: string,
    a103Name: string,
    cookies: any,
  ): Promise<any> {
    console.log(a105pin, cookies);

    if (cookies.RE1JESSIONID) {
      this.WMONID = cookies.WMONID;
      this.RE1JESSION_VALUE = cookies.RE1JESSIONID;
    }

    const encodedA103Name = this.eucKrPercentEncode(a103Name);

    // Construct the query parameters
    const queryParams = {
      cmd: 'RISUConfirmSimpleC',
      a105pin,
      wkofficeid: '1101',
      inpJobDiv: 'list',
      a103Name: encodedA103Name,
      nameType: '1',
    };
    console.log(queryParams);

    // 파라미터를 기반으로 최종 URL을 생성
    const requestURL = `${this.baseURL}?${Object.entries(queryParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`;
    console.log('최종 요청 URL:', requestURL);

    return this.axiosInstance
      .get(requestURL, { responseType: 'arraybuffer' })
      .then((response) => {
        const utf8Html = iconv.decode(response.data, 'EUC-KR');

        const $ = cheerio.load(utf8Html);
        return $('body').text();
      });
  }

  public async getSampleList(
    clsFlag: string,
    txtSimpleAddress: string,
    e001adminRegn1: string,
    currentPage: string,
    cookies: any,
    selkindcls: string = '',
  ): Promise<any> {
    // this.utilsService.startProcess('getSampleListgetSampleListgetSampleList');

    if (cookies.JSESSIONID) {
      this.WMONID = cookies.WMONID;
      this.JSESSION_VALUE = cookies.JSESSIONID;
    }

    const encodedClsFlag = this.eucKrPercentEncode(clsFlag);
    const encodedTxtSimpleAddress = this.eucKrPercentEncode(txtSimpleAddress);
    const encodedE001adminRegn1 = this.eucKrPercentEncode(e001adminRegn1);
    const encodedSelkindcls = this.eucKrPercentEncode(selkindcls);

    // Construct the query parameters
    const queryParams = {
      cmd: 'RISUConfirmSimpleC',
      selkindcls: encodedSelkindcls,
      vAddrCls: '3',
      y202pay_no_docs: '1',
      cls_flag: encodedClsFlag,
      txt_simple_address: encodedTxtSimpleAddress,
      e001admin_regn1: encodedE001adminRegn1,
      currentPage: currentPage,
    };
    console.log(queryParams);

    // 파라미터를 기반으로 최종 URL을 생성
    const requestURL = `${this.baseURL}?${Object.entries(queryParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`;
    console.log('최종 요청 URL:', requestURL);

    return this.axiosInstance
      .get(requestURL, { responseType: 'arraybuffer' })
      .then((response) => {
        const utf8Html = iconv.decode(response.data, 'EUC-KR');

        const $ = cheerio.load(utf8Html);

        const total = $('.pg_sum > span').text();

        const tableRows = $('.list_table table tbody tr');
        const results = [];

        tableRows.each((i, row) => {
          const columns = $(row).find('td');
          if (columns.length > 0) {
            const result = {
              uniqueId: $(columns[0]).text().trim(),
              type: $(columns[1]).text().trim(),
              address: $(columns[2]).text().trim(),
              status: $(columns[4]).find('img').attr('alt'),
            };
            results.push(result);
          }
        });

        // this.utilsService.endProcess('getSampleListgetSampleListgetSampleList');

        return { total: total, results: results };
      });
  }
}

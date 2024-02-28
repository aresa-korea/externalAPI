import { Controller, Get, Query } from '@nestjs/common';
import { ApiIrosService } from './api-iros.service';

@Controller('api-iros')
export class ApiIrosController {
  constructor(private readonly apiIrosService: ApiIrosService) {}
  private readonly IROS_ID = 'lg7121';
  private readonly IROS_PASSWD = '158Rotc5@';

  @Get('sample-list')
  async getSampleList(
    @Query('cls_flag') cls_flag: string,
    @Query('txt_simple_address') txt_simple_address: string,
    @Query('e001admin_regn1') e001admin_regn1: string,
    @Query('current_page') current_page: string,
  ) {
    return await this.apiIrosService.loginTest().then((cookies) => {
      console.log(cookies);
      return this.apiIrosService.getSampleList(
        cls_flag,
        txt_simple_address,
        e001admin_regn1,
        current_page,
        cookies,
      );
    });
  }

  @Get('sample-group')
  async getSampleGroup(
    @Query('cls_flag') cls_flag: string,
    @Query('txt_simple_address') txt_simple_address: string,
    @Query('e001admin_regn1') e001admin_regn1: string,
    @Query('current_page') current_page: string,
    @Query('selkindcls') selkindcls: string,
  ) {
    const cookies = await this.apiIrosService.loginTest();
    const sampleList = await this.apiIrosService.getSampleList(
      cls_flag,
      txt_simple_address,
      e001admin_regn1,
      current_page,
      cookies,
      selkindcls,
    );

    console.log(sampleList);

    if (!sampleList) return { total: '', results: [] };

    console.log(sampleList.results[0]);

    const baseAddress = sampleList.results[0].address
      .replace(/제\d+동|제\d+호|제\d+층/g, '@@@')
      .split('@@@')[0];
    const sampleUpList = await this.apiIrosService.getSampleList(
      cls_flag,
      baseAddress,
      e001admin_regn1,
      current_page,
      cookies,
      selkindcls,
    );

    if (!sampleUpList) return { total: '', results: [] };
    sampleUpList.address = baseAddress;
    sampleUpList.buildingKind = selkindcls;
    sampleUpList.clsFlag = cls_flag;
    sampleUpList.totalPage = 1;

    // 결과 전체 페이지
    const totalUpCount = sampleUpList.total;
    if (totalUpCount > 10) {
      const totalUpPage = Math.ceil(totalUpCount / 10);
      sampleUpList.totalPage = totalUpPage;

      // 병렬처리
      const findAllSampleList = [];
      for (let i = 2; i <= totalUpPage; i++) {
        findAllSampleList.push(
          this.apiIrosService.getSampleList(
            cls_flag,
            baseAddress,
            e001admin_regn1,
            i.toString(),
            cookies,
            selkindcls,
          ),
        );
      }
      const results = await Promise.all(findAllSampleList);
      results.forEach((result) => {
        sampleUpList.results = sampleUpList.results.concat(result.results);
      });
    }

    return sampleUpList;
  }

  @Get('sample-history')
  async getSampleHistory(
    @Query('a105pin') a105pin: string,
    @Query('a103Name') a103Name: string,
  ) {
    if (a105pin) a105pin = '24422004000969';
    if (a103Name) a103Name = '김찬숙';
    const cookies = await this.apiIrosService.realLogin();
    return await this.apiIrosService.getSampleHistory(
      a105pin,
      a103Name,
      cookies,
    );
  }

  @Get('login')
  login() {
    return this.apiIrosService.loginTest();
  }
}

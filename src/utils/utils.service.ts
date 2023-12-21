import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class UtilsService {
  async readPdf(fullPath: string) {
    try {
      const buffer = await fs.readFileSync(fullPath);
      return buffer;
    } catch (error) {
      console.log(error);
      throw new Error('Method not implemented.');
    }
  }
  startProcess(serviceName: string) {
    console.time(`${serviceName}`);
    console.log(`${serviceName} 시작 ======================>>`);
  }

  endProcess(serviceName: string) {
    console.timeEnd(`${serviceName}`);
    console.log(`======================>> ${serviceName} 종료`);
  }

  async saveToPdf(savePath, queryAddress, binaryBuffer) {
    const current = await this.getCurrentTime();

    savePath = savePath.replace(/\s/g, '_');
    savePath = savePath.replace(/__/g, '_');

    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    } else {
      const stats = fs.statSync(savePath);
      if (!stats.isDirectory()) {
        console.log('경로가 디렉토리가 아닙니다.');
      }
    }

    const file = encodeURIComponent(`${queryAddress}_${current}.pdf`);
    const fileName = `${savePath}/${file}`;

    await fs.writeFileSync(fileName, binaryBuffer);

    return fileName;
  }

  async getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    // const minutes = now.getMinutes();

    return [year, month, day, hours].map(this.pad).join('');
    // return [year, month, day, hours, minutes].map(this.pad).join('');
  }

  private pad(number: number) {
    return number.toString().padStart(2, '0');
  }

  async getFileDownload(directory, response) {
    console.log('directory:', directory);
    try {
      const files = this.getFileList(directory);
      return this.getFileBinary(`${directory}/${files[0]}`, response);
    } catch (error) {
      console.error('Error reading directory:', error);
      return '다운로드 실패'; // 디렉토리 읽기 실패 시 빈 배열 반환
    }
  }

  getFileList(directory: string) {
    try {
      const files = fs.readdirSync(directory);
      return files;
    } catch (error) {
      console.error('Error reading directory:', error);
      return []; // 디렉토리 읽기 실패 시 빈 배열 반환
    }
  }

  getFileBinary(filePath: string, response) {
    try {
      const file = fs.readFileSync(filePath);
      response.setHeader('Content-Type', 'application/pdf');
      response.send(file);
    } catch (error) {
      console.error('Error sending file:', error);
      response.status(500).send('Error sending file');
    }
  }
}

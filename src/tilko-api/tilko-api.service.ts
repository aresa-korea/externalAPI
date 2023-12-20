import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as NodeRSA from 'node-rsa';
import * as Crypto from 'crypto';

@Injectable()
export class TilkoApiService {
  private ENDPOINT: string;
  private API_KEY: string;
  private GET_PUBLIC_KEY_URL: string;

  constructor() {
    this.ENDPOINT = process.env.TILKO_API_ENDPOINT;
    this.API_KEY = process.env.TILKO_API_KEY;
    this.GET_PUBLIC_KEY_URL = `${this.ENDPOINT}api/Auth/GetPublicKey?APIKey=${this.API_KEY}`;
  }

  async getCommonHeader(aesKey) {
    console.time('rsaPublicKey');
    const rsaPublicKey = await this.getPublicKey();
    console.timeEnd('rsaPublicKey');

    console.time('aesCipherKey');
    const aesCipherKey = await this.rsaEncrypt(rsaPublicKey, aesKey);
    console.timeEnd('aesCipherKey');

    return {
      'Content-Type': 'application/json',
      'API-KEY': this.API_KEY,
      'ENC-KEY': aesCipherKey,
    };
  }
  async rsaEncrypt(publicKey: string, aesKey: Buffer): Promise<string> {
    console.time('NodeRSA Encryption');
    const key = new NodeRSA(
      `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
      { encryptionScheme: 'pkcs1' },
    );
    const encrypted = key.encrypt(aesKey, 'base64');
    console.timeEnd('NodeRSA Encryption');

    return encrypted;
  }

  private async getPublicKey(): Promise<string> {
    try {
      console.time('axios.get PublicKey');
      const response = await axios.get(this.GET_PUBLIC_KEY_URL);
      console.timeEnd('axios.get PublicKey');
      return response.data.PublicKey;
    } catch (error) {
      console.error('Error fetching public key:', error.message);
      throw new Error('Failed to fetch public key');
    }
  }

  async aesEncrypt(
    key: Buffer,
    iv: Buffer,
    plainText: string,
  ): Promise<string> {
    console.time('AES Encryption');
    const cipher = Crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    console.timeEnd('AES Encryption');
    return encrypted;
  }

  async getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    return [year, month, day, hours, minutes].map(this.pad).join('');
  }

  private pad(number: number) {
    return number.toString().padStart(2, '0');
  }
}

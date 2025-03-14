import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  encryptAES(req: Request, res: Response) {
    if (!process.env.TWITTER_PASSWORD) {
      throw new Error('TWITTER_PASSWORD is not set in environment variables');
    }

    return process.env.TWITTER_PASSWORD;
  }

  async getTwitterPasswordHas() {
    console.log('getTwitterPasswordHas...');
    if (!process.env.TWITTER_PASSWORD) {
      throw new Error(
        'TWITTER_PASSWORD_HAS is not set in environment variables'
      );
    }

    const keyHex = crypto.randomBytes(32).toString('hex');
    console.log('keyHex: ', keyHex);

    const decryptedMessage = await this.authService.encryptAES(
      process.env.TWITTER_PASSWORD,
      keyHex
    );
    return decryptedMessage;
  }

  async getTwitterPassword() {
    console.log('getTwitterPasswordHas...');
    if (!process.env.TWITTER_PASSWORD_HAS) {
      throw new Error(
        'TWITTER_PASSWORD_HAS is not set in environment variables'
      );
    }
    if (!process.env.KEY_HAX) {
      throw new Error('KEY_HAX is not set in environment variables');
    }

    if (!process.env.IV_HAX) {
      throw new Error('IV_HAX is not set in environment variables');
    }

    if (!process.env.AUTH_TAG_HEX) {
      throw new Error('AUTH_TAG_HEX is not set in environment variables');
    }

    const decryptedMessage = await this.authService.decryptAES(
      process.env.TWITTER_PASSWORD_HAS,
      process.env.KEY_HAX,
      process.env.IV_HAX,
      process.env.AUTH_TAG_HEX
    );
    return decryptedMessage;
  }
}

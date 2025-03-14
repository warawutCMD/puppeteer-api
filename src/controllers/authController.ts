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

  async encryptAES(pass: string) {
    console.log('encryptAES...');
    if (!pass) {
      throw new Error('password is not set in environment variables');
    }

    const keyHex = crypto.randomBytes(32).toString('hex');
    console.log('keyHex: ', keyHex);

    const decryptedMessage = await this.authService.encryptAES(pass, keyHex);
    return decryptedMessage;
  }

  async decryptAES(passHas: string) {
    console.log('decryptAES...');
    if (!passHas) {
      throw new Error('passHas is not set in environment variables');
    }

    const decryptedMessage = await this.authService.decryptPassAES(passHas);
    return decryptedMessage;
  }
}

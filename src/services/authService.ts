import dotenv from 'dotenv';
import * as crypto from 'crypto';
dotenv.config();

export class AuthService {
  encryptOTP(text: string, key: Buffer): string {
    const textBuffer = Buffer.from(text, 'utf-8');
    const encrypted = Buffer.alloc(textBuffer.length);

    for (let i = 0; i < textBuffer.length; i++) {
      encrypted[i] = textBuffer[i] ^ key[i];
    }
    return encrypted.toString('hex'); // เข้ารหัสเป็นรูปแบบ HEX
  }

  decryptOTP(encryptedHex: string, key: Buffer): string {
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const decrypted = Buffer.alloc(encryptedBuffer.length);

    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ key[i];
    }
    return decrypted.toString('utf-8');
  }

  encryptAES(text: string, keyHex: string) {
    const key = Buffer.from(keyHex, 'hex'); // ✅ คีย์ 256-bit (32 bytes)
    const iv = crypto.randomBytes(12); // ✅ IV 12 bytes (แนะนำสำหรับ AES-GCM)

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); // ✅ AuthTag 16 bytes

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  decryptAES(
    encryptedHex: string,
    keyHex: string,
    ivHex: string,
    authTagHex: string
  ): string {
    const key = Buffer.from(keyHex, 'hex'); // ✅ คีย์ 256-bit (32 bytes)
    const iv = Buffer.from(ivHex, 'hex'); // ✅ IV 12 bytes
    const authTag = Buffer.from(authTagHex, 'hex'); // ✅ AuthTag 16 bytes
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex'); // ✅ แปลงเป็น Buffer

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // ✅ ใช้ Buffer ตลอดเพื่อหลีกเลี่ยง TS error
    let decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decryptedBuffer.toString('utf8'); // ✅ แปลง Buffer เป็น String
  }

  async decryptPassAES(passHas: string) {
    console.log('getTwitterPasswordHas...');
    if (!passHas) {
      throw new Error('passHas is not set in environment variables');
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

    const decryptedMessage = await this.decryptAES(
      passHas,
      process.env.KEY_HAX,
      process.env.IV_HAX,
      process.env.AUTH_TAG_HEX
    );
    return decryptedMessage;
  }
}

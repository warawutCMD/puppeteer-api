import puppeteer from 'puppeteer-extra';
import type { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config();

export class PuppeteerService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    puppeteer.use(StealthPlugin());
  }

  // เริ่มต้น Puppeteer Browser
  async launchBrowser() {
    if (!this.browser) {
      console.log('Launching browser...');
      this.browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  // ปิด Browser
  async closeBrowser() {
    if (this.browser) {
      console.log('Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }

  userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:79.0) Gecko/20100101 Firefox/79.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0',
  ];
  randomUserAgent =
    this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

  // ✅ ฟังก์ชันสุ่ม Delay การพิมพ์หรือคลิกเร็วเกินไปอาจถูกตรวจจับว่าเป็น Bot
  randomDelay = (min = 500, max = 2000) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // Scrape ข้อมูลจากเว็บไซต์
  async scrapeWebsite(url: string) {
    if (!this.browser) throw new Error('Browser not launched');
    if (!url) throw new Error('url invalid');

    const page = await this.browser.newPage();
    await page.goto(url);
    const data = await page.evaluate(() => {
      // ติดตาม data ที่ต้องการจากหน้าเว็บ
      return document.title;
    });
    return data;
  }
}

// // ✅ ฟังก์ชันสุ่ม Delay การพิมพ์หรือคลิกเร็วเกินไปอาจถูกตรวจจับว่าเป็น Bot
// export function randomDelay(min: number, max: number): number {
//   return Math.random() * (max - min) + min;
// }

// const userAgents = [
//   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
//   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:79.0) Gecko/20100101 Firefox/79.0',
//   'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0',
// ];
// export function randomUserAgent() {
//   return userAgents[Math.floor(Math.random() * userAgents.length)];
// }

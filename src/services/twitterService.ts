// src/services/twitterService.ts
import puppeteer from 'puppeteer-extra';
import type { Browser, Page } from 'puppeteer';
import { PuppeteerService } from './puppeteerService';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import dotenv from 'dotenv';
import { AuthService } from './authService';

dotenv.config();

export class TwitterService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private puppeteerService: PuppeteerService;
  private authService: AuthService;

  private email: string | null = null;
  private username: string | null = null;
  private password: string;
  constructor() {
    puppeteer.use(StealthPlugin());
    this.puppeteerService = new PuppeteerService();
    this.authService = new AuthService();

    this.email = process.env.TWITTER_EMAIL || null;
    this.username = process.env.TWITTER_USERNAME || null;
    this.password = process.env.TWITTER_PASSWORD || '';
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

  async isLoggedIn(page: Page) {
    try {
      const currentUrl = page.url();
      if (currentUrl.includes('x.com/i/flow/login')) {
        return false; // อยู่ที่หน้าล็อกอิน แสดงว่ายังไม่ได้ล็อกอิน
      }

      return await page.evaluate(() => {
        return (
          document.body.innerText.includes('Home') ||
          document.body.innerText.includes('Following')
        );
      });
    } catch (error) {
      console.log('Error checking login status:', error);
      return false;
    }
  }

  async loginToTwitter(page: Page) {
    console.log('🔄 Logging into Twitter...');
    await page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });

    if (!this.email) throw new Error('email invalid');
    if (!this.username) throw new Error('username invalid');

    // ใส่ username
    await page.waitForSelector('input[autocomplete="username"]', {
      timeout: 5000,
    });

    await page.type('input[name="text"]', this.email, {
      delay: 100,
    });
    await page.keyboard.press('Enter');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // ✅ ตรวจสอบและกรอกเบอร์โทรศัพท์ (ถ้า Twitter ขอ)
    if (await page.$("input[name='text']")) {
      console.log('⚠️ Twitter ขอให้ยืนยันเบอร์โทรศัพท์');
      await page.type("input[name='text']", this.username, {
        delay: this.puppeteerService.randomDelay(80, 150),
      });
      await page.keyboard.press('Enter');
      await new Promise((resolve) =>
        setTimeout(resolve, this.puppeteerService.randomDelay(2000, 4000))
      );
    }

    // // ดึง password จาก AuthService
    const password = await this.authService.getTwitterPassword();

    // ใส่ password
    await page.type('input[name="password"]', password, { delay: 100 });
    await page.keyboard.press('Enter');

    // รอผลลัพธ์ของการล็อกอิน
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 10000,
      });
    } catch (error) {
      console.log('❌ Timeout: Twitter ไม่ตอบสนอง');
    }

    // ✅ ตรวจสอบว่าล็อกอินสำเร็จหรือไม่
    const loggedIn = await this.isLoggedIn(page);
    if (loggedIn) {
      console.log('✅ Login successful!');
      // บันทึก cookies ใหม่
      const newCookies = await page.cookies();
      fs.writeFileSync(
        'cookies_twitter.json',
        JSON.stringify(newCookies, null, 2)
      );
    } else {
      console.log('❌ Login failed.');
    }
  }

  async fetchTweetData(url: string) {
    if (!this.browser) throw new Error('Browser not launched');
    if (!url) throw new Error('url invalid');

    const page = await this.browser.newPage();
    await page.setUserAgent(this.puppeteerService.randomUserAgent);

    const devtools = await page.target().createCDPSession();
    console.log('ตรวจสอบ cookies');
    if (fs.existsSync('cookies_twitter.json')) {
      const cookies = JSON.parse(
        fs.readFileSync('cookies_twitter.json', 'utf-8')
      );
      await page.setCookie(...cookies);
      console.log('ใช้ cookies สำเร็จ');
    }

    let tweetData = null;

    page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('TweetDetail')) {
        console.log('✅ พบ API TweetDetail:', url);

        try {
          const body = await response.text();
          tweetData = JSON.parse(body);
          console.log('✅ ดึงข้อมูลจาก API เรียบร้อย:', tweetData);
        } catch (err) {
          console.log('⚠️ Error extracting response:', err);
        }
      }
    });

    // ✅ ตรวจสอบว่า Twitter ยังล็อกอินอยู่ไหม
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });

    console.log('ตรวจสอบว่า Twitter ยังล็อกอินอยู่ไหม');
    const loggedIn = await this.isLoggedIn(page);

    if (!loggedIn) {
      console.log('❌ Not logged in! Trying to login...');
      await this.loginToTwitter(page); // 🔹 ล็อกอินใหม่
    }

    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('✅ ดึงข้อมูลจาก API เรียบร้อย:', tweetData);

    return tweetData;
  }

  async extractTweetData(postUrl: string) {
    // const tweetJSON: TweetJsonType = await this.fetchTweetData(postUrl);
    const tweetJSON: any = await this.fetchTweetData(postUrl);
    if (!tweetJSON) {
      console.log('❌ ไม่พบข้อมูลโพสต์');
      return null;
    }

    // ✅ ดึงข้อมูลจาก JSON
    let tweet = tweetJSON.data.threaded_conversation_with_injections_v2
      ? tweetJSON.data.threaded_conversation_with_injections_v2.instructions[0]
          .entries[0].content.itemContent.tweet_results.result
      : tweetJSON.data.tweetResult?.result;

    tweet = tweet?.tweet ? tweet?.tweet : tweet;
    console.log('tweet : ', tweet);
    const extractedData = {
      postId: tweet?.rest_id,
      name: tweet?.core?.user_results?.result?.legacy?.name,
      profileName: tweet?.core?.user_results?.result?.legacy?.screen_name,
      profileImage:
        tweet?.core?.user_results?.result?.legacy?.profile_image_url_https,
      followerCount: tweet?.core?.user_results?.result?.legacy?.followers_count,
      content: tweet?.legacy?.full_text,
      contentImages: tweet?.legacy?.entities.media
        ? (tweet.legacy.entities.media as { media_url_https: string }[]).map(
            (m) => m.media_url_https
          )
        : [],
      commentsCount: tweet?.legacy?.reply_count,
      likesCount: tweet?.legacy?.favorite_count,
      sharesCount: tweet?.legacy?.retweet_count,
      views: tweet?.views?.count,
      timestamp: tweet?.legacy?.created_at,
    };

    console.log('✅ ดึงข้อมูลโพสต์สำเร็จ:', extractedData);
    return extractedData;
  }

  async checkLogin() {
    const browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });
    const loggedIn = await this.isLoggedIn(page);
    console.log('loggedIn : ', loggedIn);

    if (!loggedIn) {
      console.log('❌ Not logged in! Trying to login...');
      await this.loginToTwitter(page); // 🔹 ล็อกอินใหม่
    }
  }
}

type TweetJsonType = {
  data: {
    threaded_conversation_with_injections_v2?: {
      instructions: {
        entries: {
          content: { itemContent: { tweet_results: { result: any } } };
        }[];
      }[];
    };
    tweetResult?: { result: any };
  };
};

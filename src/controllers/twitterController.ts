import { PuppeteerService } from '../services/puppeteerService';
import { Request, Response } from 'express';
import { TwitterService } from '../services/twitterService';

export class TwitterController {
  private puppeteerService: PuppeteerService;
  private twitterService: TwitterService;

  constructor() {
    this.puppeteerService = new PuppeteerService();
    this.twitterService = new TwitterService();
  }

  // API endpoint สำหรับการ scrape เว็บไซต์
  async scrapeData(req: Request, res: Response): Promise<Response> {
    try {
      const url = req.query.url;
      const passHas =
        typeof req.query.passHas === 'string' ? req.query.passHas : undefined;

      if (typeof url !== 'string') {
        return res
          .status(400)
          .json({ error: 'URL is required and must be a string' });
      }

      await this.twitterService.launchBrowser();
      const data = await this.twitterService.extractTweetData(url, passHas);
      await this.twitterService.closeBrowser();
      return res.json(data);
    } catch (error) {
      await this.twitterService.closeBrowser();
      console.error('Error during scraping:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }
}

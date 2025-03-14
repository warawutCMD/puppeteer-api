import { PuppeteerService } from '../services/puppeteerService';
import { Request, Response } from 'express';

export class PuppeteerController {
  private puppeteerService: PuppeteerService;

  constructor() {
    this.puppeteerService = new PuppeteerService();
  }

  // API endpoint สำหรับการ scrape เว็บไซต์
  async scrapeData(req: Request, res: Response): Promise<Response> {
    try {
      const { url, passHas } = req.query;

      if (typeof url !== 'string') {
        return res
          .status(400)
          .json({ error: 'URL is required and must be a string' });
      }

      await this.puppeteerService.launchBrowser();
      const data = await this.puppeteerService.scrapeWebsite(url);
      // await this.puppeteerService.closeBrowser();
      return res.json(data);
    } catch (error) {
      await this.puppeteerService.closeBrowser();
      console.error('Error during scraping:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }
}

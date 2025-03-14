import express from 'express';
import { Request, Response } from 'express';
import { PuppeteerController } from './controllers/puppeteerController';
import { TwitterController } from './controllers/twitterController';
import { AuthController } from './controllers/authController';
// import { PuppeteerService } from './services/puppeteerService';

const app = express();
const port = 3000;

// const puppeteerService = new PuppeteerService();
const puppeteerController = new PuppeteerController();
const twitterController = new TwitterController();
const authController = new AuthController();

// เปิดเบราว์เซอร์เมื่อโปรเจคเริ่มต้น
// puppeteerService.launchBrowser().then(() => {
//   console.log('Puppeteer browser launched');
// });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/scrape', async (req: Request, res: Response) => {
  try {
    await puppeteerController.scrapeData(req, res);
  } catch (error) {
    console.error('Error in scrape route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/twitter', async (req: Request, res: Response) => {
  try {
    await twitterController.scrapeData(req, res);
  } catch (error) {
    console.error('Error in scrape route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/encrypt', async (req: Request, res: Response) => {
  try {
    const data = await authController.encryptAES(req.body.Pass);
    res.json(data);
  } catch (error) {
    console.error('Error: ', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/decrypt', async (req: Request, res: Response) => {
  try {
    const data = await authController.decryptAES(req.body);
    res.json(data);
  } catch (error) {
    console.error('Error: ', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

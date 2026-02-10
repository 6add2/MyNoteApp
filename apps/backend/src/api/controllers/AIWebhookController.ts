import type { Request, Response } from 'express';

export class AIWebhookController {
  public async ocr(req: Request, res: Response): Promise<void> {
    // TODO: forward to n8n workflow
    res.json({ text: 'ocr-result' });
  }

  public async chat(req: Request, res: Response): Promise<void> {
    // TODO: invoke AI chat
    res.json({ reply: 'ai-reply' });
  }

  public async summarize(req: Request, res: Response): Promise<void> {
    // TODO: summarize note content
    res.json({ summary: 'summary text' });
  }

  public async webhook(req: Request, res: Response): Promise<void> {
    // TODO: receive AI results and broadcast via WS
    res.status(200).json({ received: true });
  }
}


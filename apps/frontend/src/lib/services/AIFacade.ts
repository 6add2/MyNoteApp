import type { Stroke } from '../../shared-types';

// Use Render backend as the default API base. You can still override via VITE_API_URL if needed.
const API_BASE =
  import.meta.env.VITE_API_URL || 'https://mynoteapp-g3wt.onrender.com/api';

export class AIFacade {
  public async uploadScreenshot(): Promise<string> {
    // TODO: send screenshot to n8n/AI pipeline
    return 'screenshot-id';
  }

  public async triggerAIQuestion(content: string, question: string): Promise<string> {
    // TODO: call AI endpoint
    return `response for ${question}`;
  }

  /**
   * Process OCR on stroke data
   */
  public async processOCR(strokes: Stroke[]): Promise<string> {
    try {
      // Convert strokes to image
      const imageData = this.strokesToImage(strokes);

      // POST to OCR endpoint
      const response = await fetch(`${API_BASE}/ai/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error('Failed to process OCR');
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert strokes to image data URL
   */
  private strokesToImage(strokes: Stroke[]): string {
    // Create temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
    });

    // Convert to data URL
    return canvas.toDataURL('image/png');
  }
}

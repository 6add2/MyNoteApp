export interface FrameParams {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  content?: string;
  url?: string;
}

export interface Frame {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content?: string;
  url?: string;
  locked?: boolean;
}

export class FrameFactory {
  public createFrame(type: string, params: FrameParams): Frame {
    // TODO: integrate with YDocManager to persist in shared map
    return {
      id: crypto.randomUUID(),
      type,
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      zIndex: params.zIndex ?? 1,
      content: params.content,
      url: params.url,
      locked: false,
    };
  }
}


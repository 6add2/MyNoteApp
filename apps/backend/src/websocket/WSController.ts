import type { Server as HttpServer } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';

// y-websocket v1.5.x exposes the server-side helper in bin/utils.js.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setupWSConnection } = require('y-websocket/bin/utils') as {
  setupWSConnection: (conn: WebSocket, req: unknown) => void;
};

/**
 * WSController
 *  - Attaches a Yjs WebSocket server to the existing HTTP server
 *  - Uses y-websocket's setupWSConnection helper (v1.5.x)
 *
 * The frontend WebsocketProvider connects with:
 *   new WebsocketProvider('ws://host:port', 'note-<id>', ydoc)
 * which results in a URL like:
 *   ws://host:port/note-<id>
 */
export class WSController {
  public static attachToServer(server: HttpServer): void {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (socket: WebSocket, request: unknown) => {
      try {
        setupWSConnection(socket, request);
      } catch (error) {
        console.error('WS connection error:', error);
      }
    });
  }
}



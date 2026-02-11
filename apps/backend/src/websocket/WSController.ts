import type { Server as HttpServer } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import * as Y from 'yjs';
import { Note } from '../models/Note';

// y-websocket v1.5.x exposes the server-side helper and persistence hooks in bin/utils.js.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  setupWSConnection,
  setPersistence,
} = require('y-websocket/bin/utils') as {
  setupWSConnection: (conn: WebSocket, req: unknown) => void;
  setPersistence: (persistence: {
    bindState: (docName: string, ydoc: Y.Doc) => void;
    writeState: (docName: string, ydoc: Y.Doc) => Promise<unknown>;
    provider?: unknown;
  }) => void;
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
    // Configure Yjs persistence so that each note room (`yjs/note-<noteId>`)
    // is backed by the Note.yDocSnapshot field in MongoDB.
    //
    // This makes Yjs rooms effectively "permanent": when the last client
    // disconnects and the server later restarts, the next client that
    // opens the note will see the previously saved content.
    setPersistence({
      bindState: (docName: string, ydoc: Y.Doc) => {
        // Expected docName pattern for note content:
        //   "yjs/note-<mongoNoteId>"
        const NOTE_PREFIX = 'yjs/note-';
        if (!docName.startsWith(NOTE_PREFIX)) {
          // Ignore non-note documents (e.g. other rooms)
          return;
        }

        const noteId = docName.slice(NOTE_PREFIX.length);
        if (!noteId) {
          return;
        }

        // Load existing snapshot (if any) and apply it to the Y.Doc.
        // We intentionally don't await here because y-websocket calls
        // bindState synchronously; async work continues in the background
        // and any applied updates are broadcast to connected clients.
        (async () => {
          try {
            const note = await Note.findById(noteId).select('yDocSnapshot').exec();
            const snapshotBuffer = note?.yDocSnapshot;
            if (snapshotBuffer && snapshotBuffer.length > 0) {
              // Buffer is a Uint8Array, which Y.applyUpdate accepts directly.
              Y.applyUpdate(ydoc, new Uint8Array(snapshotBuffer));
            }
          } catch (error) {
            // Log and continue without snapshot; the room will start empty.
            // eslint-disable-next-line no-console
            console.error('Yjs bindState error for doc', docName, error);
          }
        })().catch(() => {
          // Swallow unhandled rejection; already logged above if needed.
        });

        // On every document update, persist the latest state snapshot
        // back into MongoDB so future sessions can restore it.
        ydoc.on('update', (/* update: Uint8Array */) => {
          (async () => {
            try {
              const fullState = Y.encodeStateAsUpdate(ydoc);
              await Note.updateOne(
                { _id: noteId },
                { $set: { yDocSnapshot: Buffer.from(fullState) } },
                { upsert: false }
              ).exec();
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Yjs persistence update error for doc', docName, error);
            }
          })().catch(() => {
            // Ignore background persistence errors.
          });
        });
      },
      // y-websocket calls writeState when the last client disconnects.
      // We already persist on every update, so this can be a no-op.
      writeState: async () => {
        return;
      },
      provider: undefined,
    });

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



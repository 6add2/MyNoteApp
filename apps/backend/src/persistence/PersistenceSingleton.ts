export class PersistenceSingleton {
  private static instance: PersistenceSingleton;
  // TODO: add db client (MongoDB)

  private constructor() {}

  public static getInstance(): PersistenceSingleton {
    if (!PersistenceSingleton.instance) {
      PersistenceSingleton.instance = new PersistenceSingleton();
    }
    return PersistenceSingleton.instance;
  }

  public async loadYDoc(noteId: string): Promise<unknown> {
    // TODO: load Y.Doc snapshot from DB
    return { noteId };
  }

  public async saveYDoc(noteId: string, doc: unknown): Promise<void> {
    // TODO: persist Y.Doc snapshot
  }
}


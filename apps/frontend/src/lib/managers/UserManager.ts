export interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { x: number; y: number };
  selectedFrameId?: string;
  currentMode?: 'word' | 'ppt' | 'handwrite';
}

export class UserManager {
  private static instance: UserManager;
  public currentNoteId: string | null = null;
  public currentUser: AwarenessUser | null = null;

  private constructor() {}

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  public setCurrentUser(user: AwarenessUser): void {
    this.currentUser = user;
    // TODO: sync with ConnectionManager awareness
  }

  public setCurrentNote(noteId: string): void {
    this.currentNoteId = noteId;
    // TODO: update awareness context
  }
}
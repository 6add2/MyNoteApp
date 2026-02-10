import { AbstractCommand } from './AbstractCommand';

export class InsertSpecialElementCommand extends AbstractCommand {
  constructor(private readonly elementType: string, private readonly payload?: unknown) {
    super();
  }

  public execute(): void {
    // TODO: open popup and insert element frame
  }
}


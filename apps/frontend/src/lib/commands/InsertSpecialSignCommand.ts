import { AbstractCommand } from './AbstractCommand';

export class InsertSpecialSignCommand extends AbstractCommand {
  constructor(private readonly sign: string) {
    super();
  }

  public execute(): void {
    // TODO: insert math symbol into yRichText
  }
}


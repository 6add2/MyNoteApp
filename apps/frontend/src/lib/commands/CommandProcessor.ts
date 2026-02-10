import { AbstractCommand } from './AbstractCommand';
import { InsertSpecialSignCommand } from './InsertSpecialSignCommand';
import { InsertSpecialElementCommand } from './InsertSpecialElementCommand';

export class CommandProcessor {
  public commandBuffer = '';
  public expectingParameter = false;
  public invalidParameterRange: { from: number; to: number } | null = null;

  public handleCommandInput(event: Event): void {
    // TODO: parse event and update commandBuffer
  }

  public applyParameterValidation(): void {
    // TODO: set invalidParameterRange when params missing
  }

  public clearParameterValidation(): void {
    this.invalidParameterRange = null;
  }

  public finalizeCommand(): void {
    // TODO: decide which command to execute based on buffer
  }

  public execute(command: AbstractCommand): void {
    command.execute();
  }

  // Helpers to instantiate commands
  public createSignCommand(symbol: string): InsertSpecialSignCommand {
    return new InsertSpecialSignCommand(symbol);
  }

  public createElementCommand(type: string, payload?: unknown): InsertSpecialElementCommand {
    return new InsertSpecialElementCommand(type, payload);
  }
}


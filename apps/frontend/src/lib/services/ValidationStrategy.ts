export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export class ValidationStrategy {
  public validate(command: string): ValidationResult {
    // TODO: implement actual validation rules for command syntax
    return { valid: !!command };
  }
}


export const isNonEmptyString = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;

export const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};


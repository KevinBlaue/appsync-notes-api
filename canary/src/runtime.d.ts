declare module 'Synthetics' {
  export function executeStep<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

declare module 'SyntheticsLogger' {
  export function info(message: string): void;
}

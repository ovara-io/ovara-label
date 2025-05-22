export {};

declare global {
  interface Window {
    electron: {
      openFolder(): Promise<string | null>;
      readDir(path: string): Promise<string[]>;
      readFile(path: string): Promise<string>;
      writeFile(path: string, contents: string): Promise<void>;
    };
  }
}

export const pickFolder = () => window.electron.openFolder();
export const readDir = (path: string) => window.electron.readDir(path);
export const readFile = (path: string) => window.electron.readFile(path);
export const writeFile = (path: string, contents: string) =>
  window.electron.writeFile(path, contents);

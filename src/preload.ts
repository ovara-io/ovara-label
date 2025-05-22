// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:open-folder"),

  readDir: (path: string): Promise<string[]> =>
    ipcRenderer.invoke("fs:read-dir", path),

  readFile: (path: string): Promise<string> =>
    ipcRenderer.invoke("fs:read-file", path),

  writeFile: (path: string, contents: string): Promise<void> =>
    ipcRenderer.invoke("fs:write-file", path),
});

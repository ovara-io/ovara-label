import { dialog, ipcMain } from "electron";
import fs from "fs/promises";
import path from "path";

ipcMain.handle("dialog:open-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("fs:read-dir", async (_, dirPath) => {
  return fs.readdir(dirPath);
});

ipcMain.handle("fs:read-file", async (_, filePath) => {
  return fs.readFile(filePath, "utf-8");
});

ipcMain.handle("fs:write-file", async (_, filePath, contents) => {
  await fs.writeFile(filePath, contents, "utf-8");
});

ipcMain.handle("fs:get-image-paths", async (_, dirPath: string) => {
  const supported = [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"];

  const files = await fs.readdir(dirPath);
  return files
    .filter((f) => supported.includes(path.extname(f).toLowerCase()))
    .map((f) => `file://${path.join(dirPath, f)}`);
});

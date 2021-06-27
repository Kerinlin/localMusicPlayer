"use strict";
const electron = require("electron");
import { app, protocol, BrowserWindow, dialog } from "electron";
const { ipcMain } = require("electron");
const path = require("path");
import {
  createProtocol
  // installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";
import { autoUpdater } from "electron-updater";
const isDevelopment = process.env.NODE_ENV !== "production";
const globalShortcut = electron.globalShortcut;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 584,
    height: 361,
    autoHideMenuBar: true,
    frame: false,
    resizable: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(app.getAppPath(), "preload.js")
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
    autoUpdater.checkForUpdates();
  }

  win.on("closed", () => {
    win = null;
  });
}

let filePath;

// windows通过process.argv获取打开文件的路径
if (process.platform === "win32") {
  filePath = process.argv[1];
}

// mac监听open-file事件,获取打开文件的路径
app.on("open-file", (event, path) => {
  // win.webContents.send("path", path);
  filePath = path;
});

// 监听渲染进程的获取路径要求,把路径信息返回给渲染进程
ipcMain.on("getPath", () => {
  win.webContents.send("path", filePath);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log(event, workingDirectory);
    // 监听是否有第二个实例，向渲染进程发送第二个实例的本地路径
    win.webContents.send("path", `${commandLine[commandLine.length - 1]}`);
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.on("ready", async () => {
    // 正式环境开控制台方便调试
    globalShortcut.register("CommandOrControl+K", function() {
      win.webContents.openDevTools();
    });
    createWindow();
  });
} else {
  app.quit();
}

ipcMain.on("close", () => {
  win.close();
  app.quit();
});
ipcMain.on("minimize", () => {
  win.minimize();
});
autoUpdater.on("checking-for-update", () => {});
autoUpdater.on("update-available", () => {
  dialog.showMessageBox({
    title: "新版本发布",
    message: "有新内容更新，稍后将重新为您安装",
    buttons: ["确定"],
    type: "info",
    noLink: true
  });
});
// autoUpdater.on("update-not-available", (info) => {});
// autoUpdater.on("error", (err) => {});
// autoUpdater.on("download-progress", (progressObj) => {});
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

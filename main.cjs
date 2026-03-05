const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn, execSync } = require("child_process");
const os = require("os");

let mainWindow;

/* ------------------ Create Window ------------------ */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // icon: path.join(__dirname, "assets", "app-icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    // ✅ Production (EXE)
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  } else {
    // ✅ Development
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }
}

/* ------------------ App Ready ------------------ */
app.whenReady().then(() => {
  // Wait for backend to boot (important!)
  setTimeout(createWindow, 5000);
});

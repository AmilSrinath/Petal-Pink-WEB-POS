const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn, execSync } = require("child_process");
const os = require("os");

let backendProcess;
let mainWindow;

/* ------------------ Kill Backend ------------------ */
function killBackendProcess() {
  if (!backendProcess) return;

  try {
    if (os.platform() === "win32") {
      execSync(`taskkill /PID ${backendProcess.pid} /T /F`, {
        stdio: "ignore",
      });
    } else {
      process.kill(-backendProcess.pid);
    }
    console.log("Backend stopped");
  } catch (err) {
    console.error("Error stopping backend:", err.message);
  }
}

/* ------------------ Create Window ------------------ */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets", "gold_tra.a22f21fa01c3f6347786.ico"),
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

  mainWindow.on("closed", () => {
    killBackendProcess();
    app.quit();
  });
}

/* ------------------ App Ready ------------------ */
app.whenReady().then(() => {

  // JAR path for dev & production
  const jarPath = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "petalpink-0.0.1-SNAPSHOT.jar")
    : path.join(__dirname, "backend", "petalpink-0.0.1-SNAPSHOT.jar");

  // Start Spring Boot backend
  backendProcess = spawn("java", ["-jar", jarPath], {
    stdio: "ignore",
    detached: os.platform() !== "win32",
    shell: os.platform() === "win32",
  });

  console.log("Backend starting...");

  // Wait for backend to boot (important!)
  setTimeout(createWindow, 5000);
});

/* ------------------ Safety Exit ------------------ */
app.on("before-quit", () => {
  killBackendProcess();
});

process.on("SIGINT", () => {
  killBackendProcess();
  process.exit(0);
});

process.on("SIGTERM", () => {
  killBackendProcess();
  process.exit(0);
});
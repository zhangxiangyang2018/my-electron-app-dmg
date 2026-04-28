const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron')
const path = require('path')
const si = require('systeminformation')

if (!app.isPackaged) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe')
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
  if (!app.isPackaged) win.webContents.openDevTools()
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark'  // 强制深色，标题栏也变黑
  createWindow()
  ipcMain.handle('ping', () => 'pong')
  ipcMain.handle('get-stats', async () => {
    const [cpu, mem, gpuData, net] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.graphics(),
      si.networkStats(),
    ])
    const gpu = gpuData.controllers[0]
    const netTotal = net.reduce((s, n) => s + n.rx_sec + n.tx_sec, 0)
    return {
      cpu: Math.round(cpu.currentLoad),
      mem: { used: mem.active, total: mem.total },
      gpu: { usage: gpu?.utilizationGpu ?? null, model: gpu?.model ?? '' },
      net: netTotal,
    }
  })
  ipcMain.on('set-theme', (_, theme) => {
    nativeTheme.themeSource = theme
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

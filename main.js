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

  // 缓存 GPU 信息（si.graphics 在 Windows 上会启动 PowerShell，开销极大）
  let gpuCache = { usage: null, model: '' }
  let gpuLastFetch = 0
  async function getGpu() {
    const now = Date.now()
    // 每 30 秒才刷新一次 GPU
    if (now - gpuLastFetch < 30000) return gpuCache
    gpuLastFetch = now
    try {
      const g = await si.graphics()
      const c = g.controllers[0]
      gpuCache = { usage: c?.utilizationGpu ?? null, model: c?.model ?? '' }
    } catch {}
    return gpuCache
  }

  ipcMain.handle('get-stats', async () => {
    const [cpu, mem, gpu, net] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      getGpu(),
      si.networkStats(),
    ])
    const netTotal = net.reduce((s, n) => s + n.rx_sec + n.tx_sec, 0)
    return {
      cpu: Math.round(cpu.currentLoad),
      mem: { used: mem.active, total: mem.total },
      gpu,
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

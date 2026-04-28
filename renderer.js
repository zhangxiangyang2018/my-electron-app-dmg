function setBar(id, pct) {
  const el = document.getElementById(id)
  if (el) el.style.width = Math.min(pct, 100) + '%'
}

function fmtBytes(b) {
  if (b > 1e9) return (b / 1e9).toFixed(2) + ' GB'
  return (b / 1e6).toFixed(1) + ' MB'
}

function fmtNet(bps) {
  if (bps > 1e6) return (bps / 1e6).toFixed(1) + ' MB/s'
  return (bps / 1e3).toFixed(0) + ' KB/s'
}

// 日志
const logList = document.getElementById('log-list')
const logs = []

function addLog(msg) {
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  logs.unshift({ time: now, msg })
  if (logs.length > 50) logs.pop()
  logList.innerHTML = ''
  logs.forEach(l => {
    const div = document.createElement('div')
    div.className = 'log-entry'
    div.innerHTML = `<span class="log-time">${l.time}</span> – <span class="log-level">INFO</span> – ${l.msg}`
    logList.appendChild(div)
  })
}

// 资源轮询
async function updateStats() {
  try {
    const s = await window.electronAPI.getStats()

    document.getElementById('cpu-val').textContent = s.cpu + '%'
    setBar('cpu-bar', s.cpu)

    const gpuPct = s.gpu.usage ?? 0
    document.getElementById('gpu-val').textContent = s.gpu.usage !== null ? s.gpu.usage + '%' : 'N/A'
    setBar('gpu-bar', gpuPct)

    const memPct = Math.round(s.mem.used / s.mem.total * 100)
    document.getElementById('mem-val').textContent =
      memPct + '%  ' + fmtBytes(s.mem.used) + '/' + fmtBytes(s.mem.total)
    setBar('mem-bar', memPct)

    document.getElementById('net-val').textContent = fmtNet(s.net)
    setBar('net-bar', Math.min(s.net / 1e7 * 100, 100))

    addLog(`CPU ${s.cpu}% | MEM ${memPct}% | NET ${fmtNet(s.net)}`)
  } catch (e) {
    addLog('获取数据失败: ' + e.message)
  }
}

updateStats()
setInterval(updateStats, 3000)

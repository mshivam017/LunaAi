import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app } from 'electron'

let backendProcess: ChildProcess | null = null
let restartAttempts = 0
const MAX_RESTARTS = 3
let lastRestartTime = Date.now()

export function startBackend(isDev: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const port = '8000'
    let cmd = ''
    let args: string[] = []
    let cwd = ''

    if (isDev) {
      // In development, run python from virtual environment
      cwd = join(__dirname, '../../../backend')
      cmd = join(cwd, '.venv/Scripts/python.exe')
      args = ['-m', 'uvicorn', 'app.main:app', '--port', port, '--host', '127.0.0.1']
    } else {
      // In production, run the bundled executable
      cwd = join(app.getPath('exe'), '..')
      // Adjust path for electron-builder packaging
      cmd = join(cwd, 'resources/bin/luna-backend.exe')
      args = ['--port', port]
    }

    console.log(`Starting backend process: ${cmd} ${args.join(' ')} (CWD: ${cwd})`)

    const fs = require('fs')
    const logDir = join(app.getPath('home'), '.luna')
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
    } catch (e) {}
    const logFile = join(logDir, 'process_start.log')
    fs.writeFileSync(logFile, `Backend Spawn Attempt\nTime: ${new Date().toISOString()}\nCmd: ${cmd}\nCwd: ${cwd}\nArgs: ${args.join(' ')}\n\n`)

    try {
      backendProcess = spawn(cmd, args, {
        cwd,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        shell: isDev ? true : false // Disable shell in production for direct CreateProcess launch
      })

      backendProcess.stdout?.on('data', (data) => {
        const text = data.toString()
        console.log(`[Backend]: ${text.trim()}`)
        fs.appendFileSync(logFile, `[STDOUT]: ${text}`)
      })

      backendProcess.stderr?.on('data', (data) => {
        const text = data.toString()
        console.error(`[Backend-Err]: ${text.trim()}`)
        fs.appendFileSync(logFile, `[STDERR]: ${text}`)
      })

      backendProcess.on('error', (err) => {
        fs.appendFileSync(logFile, `[ERROR]: ${err.message}\n`)
      })

      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`)
        fs.appendFileSync(logFile, `[CLOSE]: Process exited with code ${code}\n`)
        
        // If backendProcess is not null, it means the exit was unexpected (not triggered by killBackend)
        if (backendProcess !== null) {
          backendProcess = null
          
          const now = Date.now()
          if (now - lastRestartTime > 30000) {
            restartAttempts = 0
          }
          
          if (restartAttempts < MAX_RESTARTS) {
            restartAttempts++
            lastRestartTime = now
            const delay = 1000 * restartAttempts
            fs.appendFileSync(logFile, `[RETRY]: Unexpected exit. Restarting backend in ${delay}ms (Attempt ${restartAttempts}/${MAX_RESTARTS})...\n`)
            console.log(`Unexpected backend exit. Restarting in ${delay}ms...`)
            setTimeout(() => {
              if (!backendProcess) {
                startBackend(isDev).catch(err => {
                  console.error('Failed to auto-restart backend:', err)
                })
              }
            }, delay)
          } else {
            fs.appendFileSync(logFile, `[CRITICAL]: Backend crashed repeatedly. Auto-restart limits reached.\n`)
          }
        } else {
          backendProcess = null
        }
      })

      // Allow a brief delay for server initialization
      setTimeout(() => {
        resolve()
      }, 2000)

    } catch (error: any) {
      console.error('Failed to spawn backend process:', error)
      fs.appendFileSync(logFile, `[CRASH]: ${error.message || error}\n`)
      reject(error)
    }
  })
}

export function killBackend() {
  if (backendProcess) {
    console.log('Terminating backend process...')
    const proc = backendProcess
    backendProcess = null // Avoid triggering auto-restart on intentional termination
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', proc.pid?.toString() || '', '/f', '/t'])
    } else {
      proc.kill('SIGINT')
    }
  }
}

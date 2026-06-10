import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export const createMainLogger = (isDev: boolean) => {
  const logFile = path.join(app.getPath('userData'), 'main.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  const log = (message: string, ...args: unknown[]): void => {
    const timestamp = new Date().toISOString();
    console.log(`[Main] ${message}`, ...args);

    if (!isDev) {
      const logPath = path.join(app.getPath('logs'), 'mixfade-main.log');
      const logMessage = `[${timestamp}] ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
      fs.appendFileSync(logPath, logMessage, 'utf8');
    }
  };

  const close = () => {
    logStream.end();
  };

  return { close, log };
};

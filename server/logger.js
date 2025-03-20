import fs from 'fs';
import path from 'path';
import striptags from 'striptags';

export function logMessage(sessionId, sender, text) {
  const logDir = path.join(process.cwd(), 'server', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFilePath = path.join(logDir, `${sessionId}.txt`);
  const plainText = striptags(text);
  const logEntry = `[${new Date().toISOString()}] ${sender}: ${plainText}\n`;
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error("Error writing chat log:", err);
    }
  });
}
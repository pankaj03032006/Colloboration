const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const logToFile = (level, message) => {
  const logEntry = `[${getTimestamp()}] [${level.toUpperCase()}] ${message}\n`;
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logEntry);
};

const logger = {
  info: (message) => {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
    logToFile('info', message);
  },
  error: (message) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    logToFile('error', message);
  },
  warn: (message) => {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`);
    logToFile('warn', message);
  },
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`\x1b[35m[DEBUG]\x1b[0m ${message}`);
    }
    logToFile('debug', message);
  }
};

module.exports = logger;
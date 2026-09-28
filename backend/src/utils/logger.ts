// src/utils/logger.ts
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
            const cid = correlationId ? ` [CID:${correlationId}]` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `[${timestamp}] ${level}${cid}: ${message}${metaStr}`;
          }),
        ),
  ),
  defaultMeta: { service: 'sharenotes-backend' },
  transports: [new winston.transports.Console()],
});

export default logger;

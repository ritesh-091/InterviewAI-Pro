const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});


// Prometheus telemetries storage
const requestCounter = {};
let totalRequests = 0;

/**
 * Express Middleware to track HTTP telemetry metrics
 */
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  totalRequests++;

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    const path = req.route ? req.route.path : req.path;
    const method = req.method;
    const status = res.statusCode;

    const key = `method="${method}",path="${path}",status="${status}"`;
    requestCounter[key] = (requestCounter[key] || 0) + 1;

    logger.info(`HTTP ${method} ${path} ${status} - ${timeInMs}ms`);
  });

  next();
};

/**
 * Formats metrics in Prometheus text specification
 */
const getPrometheusMetrics = (req, res) => {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  let lines = [
    '# HELP process_uptime_seconds Node process uptime in seconds.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${memory.rss}`,
    '',
    '# HELP process_heap_total_bytes Total heap size in bytes.',
    '# TYPE process_heap_total_bytes gauge',
    `process_heap_total_bytes ${memory.heapTotal}`,
    '',
    '# HELP process_heap_used_bytes Used heap size in bytes.',
    '# TYPE process_heap_used_bytes gauge',
    `process_heap_used_bytes ${memory.heapUsed}`,
    '',
    '# HELP http_requests_total Total HTTP requests counter.',
    '# TYPE http_requests_total counter'
  ];

  Object.keys(requestCounter).forEach(key => {
    lines.push(`http_requests_total{${key}} ${requestCounter[key]}`);
  });

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.end(lines.join('\n'));
};

module.exports = {
  logger,
  metricsMiddleware,
  getPrometheusMetrics
};

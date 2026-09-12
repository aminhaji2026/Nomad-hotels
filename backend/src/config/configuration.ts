export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  appName: process.env.APP_NAME ?? 'NomadStay',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    bucket: process.env.S3_BUCKET ?? 'nomadstay',
    accessKey: process.env.S3_ACCESS_KEY || undefined,
    secretKey: process.env.S3_SECRET_KEY || undefined,
    region: process.env.S3_REGION ?? 'us-east-1',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
});

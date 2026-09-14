import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

console.log('allowedOrigins:', allowedOrigins);

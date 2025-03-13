import dotenv from 'dotenv'
dotenv.config()

export const BACKEND_PORT: number = Number(process.env.PORT) || 3200
export const X_PLATFORM_API_KEY = process.env.X_PLATFORM_API_KEY || 'default-api-key'
export const X_PLATFORM_API_SECRET = process.env.X_PLATFORM_API_SECRET || 'default-api-secret'

import dotenv from 'dotenv'
dotenv.config()

export const BACKEND_PORT: number = Number(process.env.PORT) || 3200

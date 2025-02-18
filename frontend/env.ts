import dotenv from 'dotenv'
dotenv.config()

export const FRONTEND_PORT: number = Number(process.env.FRONTEND_PORT) || 3000

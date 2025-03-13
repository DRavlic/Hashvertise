import express, { Request, Response } from 'express'
import cors from 'cors'
import { BACKEND_PORT } from './environment'
import postsRouter from './routes/posts'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express backend!')
})

app.use('/api', postsRouter)

app.listen(BACKEND_PORT, () => {
  console.log(`Backend server is listening on port ${BACKEND_PORT}`)
})

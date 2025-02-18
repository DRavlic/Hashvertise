import express, { Request, Response } from 'express'
import cors from 'cors'
import { BACKEND_PORT } from './env'

const app = express()
app.use(cors())

const port = BACKEND_PORT

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express backend!')
})

app.listen(port, () => {
  console.log(`Backend server is listening on port ${port}`)
})

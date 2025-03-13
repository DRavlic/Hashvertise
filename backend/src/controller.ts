import { Request, Response } from 'express'
import * as postsService from '../service'
import { validatePostQuery } from '../schema/postQuerySchema'

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  if (!validatePostQuery(req.query)) {
    res.status(400).json({ error: 'Invalid query parameters' })
    return
  }
  const { username, startDate, endDate } = req.query

  try {
    const posts = await postsService.getPosts(username as string, startDate as string, endDate as string)
    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' })
  }
} 
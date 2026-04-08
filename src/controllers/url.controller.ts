import { Request, Response } from "express"
import {
  createShortUrlService,
  getOriginalUrlService
} from "../services/url.service"

export const createShortUrl = async (req: Request, res: Response) => {
  try {
    const { originalUrl } = req.body

    if (!originalUrl) {
      return res.status(400).json({
        message: "originalUrl is required"
      })
    }

    const newUrl = await createShortUrlService(originalUrl)
    const port=process.env.PORT || 5000
    
    return res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: `http://localhost:${port}/${newUrl.short_code}`,
      shortCode: newUrl.short_code,
      data: newUrl
    })
  } catch (error) {
    console.error("Error creating short URL:", error)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const redirectToOriginalUrl = async (
  req: Request<{ shortCode: string }>,
  res: Response
) => {
  try {
    const { shortCode } = req.params

    const url = await getOriginalUrlService(shortCode)

    if (!url) {
      return res.status(404).json({
        message: "Short URL not found"
      })
    }

    return res.redirect(url.original_url)
  } catch (error) {
    console.error("Error redirecting URL:", error)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}
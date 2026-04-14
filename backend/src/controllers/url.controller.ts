import { Request, Response } from "express"
import {
  createShortUrlService,
  getAllUrlsService,
  getAnalyticsByShortCodeService,
  getOriginalUrlService,
  logClickService,
  deleteUrlService
} from "../services/url.service"
import isValidUrl from "../utils/isValidUrl"
import isValidAlias from "../utils/isValidAlias"
import clickQueue from "../queues/click.queue"

export const createShortUrl = async (req: Request, res: Response) => {
  try {
    const { originalUrl, customAlias } = req.body

    if (!originalUrl) {
      return res.status(400).json({
        message: "originalUrl is required"
      })
    }

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({
        message: "Please provide a valid URL including http:// or https://"
      })
    }

    // Validate alias if provided
    if (customAlias && !isValidAlias(customAlias)) {
      return res.status(400).json({
        message:
          "Alias must be 3-20 characters and can contain letters, numbers, _ and -"
      })
    }

    const newUrl = await createShortUrlService(originalUrl, customAlias)
    const port=process.env.PORT || 5000
    return res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: `http://localhost:${port}/${newUrl.short_code}`,
      shortCode: newUrl.short_code,
      data: newUrl
    })
  } catch (error: any) {
    if (error.message === "Alias already in use") {
      return res.status(409).json({
        message: error.message
      })
    }

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
    

    // Extract metadata
    const ip =(req.headers["x-forwarded-for"] as string)?.split(",")[0] || 
    req.ip
    const userAgent = req.headers["user-agent"]
    const referrer = req.headers["referer"]

    // Log click
    await clickQueue.add("log-click", {
      urlId: url.id,
      ip,
      userAgent,
      referrer: referrer || null,
    });

    return res.redirect(url.original_url)
  } catch (error) {
    console.error("Error redirecting URL:", error)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const getAnalyticsByShortCode = async (
  req: Request<{ shortCode: string }>,
  res: Response
) => {
  try {
    const { shortCode } = req.params

    const analytics = await getAnalyticsByShortCodeService(shortCode)

    return res.status(200).json({
      message: "Analytics fetched successfully",
      shortCode,
      data: analytics
    })
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({
        message: "Short URL not found"
      })
    }

    console.error("Error fetching analytics:", error)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const getAllUrls = async (req: Request, res: Response) => {
  try {
    const urls = await getAllUrlsService()

    return res.status(200).json({
      message: "URLs fetched successfully",
      data: urls
    })
  } catch (error) {
    console.error("Error fetching URLs:", error)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const deleteUrl = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10)

    if (isNaN(id)) {
      return res.status(400).json({
        message: "Invalid URL id"
      })
    }

    await deleteUrlService(id)

    return res.status(200).json({
      message: "URL deleted successfully"
    })
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({
        message: "URL not found or already deleted"
      })
    }

    console.error("Error deleting URL:", error)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}
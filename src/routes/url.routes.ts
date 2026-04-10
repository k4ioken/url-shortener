import { Router } from "express"
import {
  createShortUrl,
  redirectToOriginalUrl,
  getAnalyticsByShortCode
} from "../controllers/url.controller"

const router = Router()

router.post("/shorten", createShortUrl)
router.get("/analytics/:shortCode", getAnalyticsByShortCode)
router.get("/:shortCode", redirectToOriginalUrl)


export default router
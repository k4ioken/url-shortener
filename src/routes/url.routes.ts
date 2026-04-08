import { Router } from "express"
import {
  createShortUrl,
  redirectToOriginalUrl
} from "../controllers/url.controller"

const router = Router()

router.post("/shorten", createShortUrl)
router.get("/:shortCode", redirectToOriginalUrl)

export default router
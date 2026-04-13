import { Router } from "express"
import {
  createShortUrl,
  redirectToOriginalUrl,
  getAnalyticsByShortCode,
  getAllUrls,
  deleteUrl
} from "../controllers/url.controller"

const router = Router()

router.post("/shorten", createShortUrl)
router.get("/analytics/:shortCode", getAnalyticsByShortCode)
router.get("/urls", getAllUrls)
router.delete("/urls/:id",deleteUrl)
router.get("/:shortCode", redirectToOriginalUrl)


export default router
import { Worker } from "bullmq"
import redis from "../config/redis"
import { logClickService } from "../services/url.service"

const clickWorker = new Worker(
  "clickQueue",
  async (job) => {
    const { urlId, ip, userAgent, referrer } = job.data

    await logClickService(urlId, ip, userAgent, referrer)
  },
  {
    connection: redis
  }
)

export default clickWorker
import { Queue } from "bullmq"
import redis from "../config/redis"

const clickQueue = new Queue("clickQueue", {
  connection: redis
})

export default clickQueue
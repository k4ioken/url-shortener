import express from "express"
import cors from "cors"
import urlRoutes from "./routes/url.routes"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("URL Shortener API is running")
})

app.use("/", urlRoutes)

export default app
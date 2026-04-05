import dotenv from "dotenv"
dotenv.config()

import app from "./app"
import pool from "./config/db"

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await pool.query("SELECT 1")
    console.log("Database connected successfully")

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Failed to connect to database", error)
  }
}

startServer()
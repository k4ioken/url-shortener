import pool from "../config/db"
import generateShortCode from "../utils/generateShortCode"

export const createShortUrlService = async (originalUrl: string) => {
  let shortCode = generateShortCode()

  const existingCodeCheck = await pool.query(
    "SELECT * FROM urls WHERE short_code = $1",
    [shortCode]
  )

  if (existingCodeCheck.rows.length > 0) {
    shortCode = generateShortCode()
  }

  const result = await pool.query(
    `
    INSERT INTO urls (original_url, short_code)
    VALUES ($1, $2)
    RETURNING *
    `,
    [originalUrl, shortCode]
  )

  return result.rows[0]
}

export const getOriginalUrlService = async (shortCode: string) => {
  const result = await pool.query(
    "SELECT * FROM urls WHERE short_code = $1 AND is_active = true",
    [shortCode]
  )

  return result.rows[0]
}
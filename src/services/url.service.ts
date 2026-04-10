import pool from "../config/db"
import generateShortCode from "../utils/generateShortCode"

export const createShortUrlService = async (
  originalUrl: string,
  customAlias?: string
  ) => {
  let shortCode: string

  // If user provided custom alias
  if (customAlias) {
    const existingAlias = await pool.query(
      "SELECT * FROM urls WHERE short_code = $1",
      [customAlias]
    )

    if (existingAlias.rows.length > 0) {
      throw new Error("Alias already in use")
    }

    shortCode = customAlias
  }

  else {
    shortCode = generateShortCode()
    let existingCodeCheck = await pool.query(
      "SELECT * FROM urls WHERE short_code = $1",
      [shortCode]
    )
    while (existingCodeCheck.rows.length > 0){
        shortCode = generateShortCode()
        existingCodeCheck = await pool.query(
            "SELECT * FROM urls WHERE short_code = $1",
            [shortCode]
        )
  }
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

export const logClickService = async (
  urlId: number,
  ip: string | undefined,
  userAgent: string | undefined,
  referrer: string | undefined
) => {
  await pool.query(
    `
    INSERT INTO clicks (url_id, ip_address, user_agent, referrer)
    VALUES ($1, $2, $3, $4)
    `,
    [urlId, ip || null, userAgent || null, referrer || null]
  )
}

export const getAnalyticsByShortCodeService = async (shortCode: string) => {
  // Check if shortCode exists (strict behavior)
  const urlCheck = await pool.query(
    "SELECT id, original_url FROM urls WHERE short_code = $1",
    [shortCode]
  )

  if (urlCheck.rows.length === 0) {
    throw new Error("NOT_FOUND")
  }

  const urlData = urlCheck.rows[0]

  // Total clicks
  const totalResult = await pool.query(
    `
    SELECT COUNT(*) 
    FROM clicks c
    JOIN urls u ON c.url_id = u.id
    WHERE u.short_code = $1
    `,
    [shortCode]
  )

  const totalClicks = parseInt(totalResult.rows[0].count, 10)

  // Recent clicks
  const recentResult = await pool.query(
    `
    SELECT c.clicked_at, c.ip_address, c.user_agent, c.referrer
    FROM clicks c
    JOIN urls u ON c.url_id = u.id
    WHERE u.short_code = $1
    ORDER BY c.clicked_at DESC
    LIMIT 5
    `,
    [shortCode]
  )

  return {
    originalUrl: urlData.original_url,
    totalClicks,
    recentClicks: recentResult.rows
  }
}
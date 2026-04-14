import pool from "../config/db"
import generateShortCode from "../utils/generateShortCode"
import redis from "../config/redis"

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
  const cached = await redis.get(shortCode);

  if (cached) {
    console.log("CACHE HIT");
    return JSON.parse(cached);
  }

  const result = await pool.query(
    "SELECT * FROM urls WHERE short_code = $1 AND is_active = true",
    [shortCode]
  )
  if(result.rows.length==0){
    return null
  }
  const url=result.rows[0]

  await redis.set(
    shortCode,
    JSON.stringify({
      id: url.id,
      original_url: url.original_url,
    }),
    "EX",
    3600,
  ); 

  return url
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

export const getAllUrlsService = async () => {
  const result = await pool.query(
    `
    SELECT 
      u.id,
      u.short_code,
      u.original_url,
      u.created_at,
      COUNT(c.id) AS click_count
    FROM urls u
    LEFT JOIN clicks c ON u.id = c.url_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
    `
  )

  return result.rows.map((row) => ({
    id: row.id,
    shortCode: row.short_code,
    originalUrl: row.original_url,
    createdAt: row.created_at,
    clickCount: parseInt(row.click_count, 10)
  }))
}

export const deleteUrlService = async (id: number) => {
  const result = await pool.query(
    `
    UPDATE urls
    SET is_active = false
    WHERE id = $1 AND is_active = true
    RETURNING *
    `,
    [id]
  )

  if (result.rows.length === 0) {
    throw new Error("NOT_FOUND")
  }

  return result.rows[0]
}
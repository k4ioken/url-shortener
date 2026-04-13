const generateShortCode = (length: number = 6): string => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

  let shortCode = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    shortCode += characters[randomIndex]
  }

  return shortCode
}

export default generateShortCode
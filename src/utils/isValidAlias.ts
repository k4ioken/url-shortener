const isValidAlias = (alias: string): boolean => {
  const regex = /^[a-zA-Z0-9_-]{3,20}$/
  return regex.test(alias)
}

export default isValidAlias
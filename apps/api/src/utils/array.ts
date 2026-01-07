export const chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

export const groupBy = <T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return items.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<K, T[]>)
}

export const unique = <T>(items: T[]): T[] => [...new Set(items)]

export const uniqueBy = <T, K>(
  items: T[],
  keyFn: (item: T) => K
): T[] => {
  const seen = new Set<K>()
  return items.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}


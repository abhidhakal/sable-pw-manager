const STORAGE_KEY = 'sable:shareSecrets'

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveShareSecret(linkId: string, secret: string): void {
  const map = load()
  map[linkId] = secret
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getShareSecret(linkId: string): string | null {
  return load()[linkId] ?? null
}

export function removeShareSecrets(linkIds: string[]): void {
  const map = load()
  for (const id of linkIds) delete map[id]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getAllShareSecrets(): Record<string, string> {
  return load()
}

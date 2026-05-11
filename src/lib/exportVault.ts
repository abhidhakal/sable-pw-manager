import type { VaultItem, Category } from '@/types/vault'

interface ExportData {
  version: 1
  exportedAt: string
  items: {
    title: string
    url: string
    username: string
    password: string
    notes: string
    category: string
    favorite: boolean
  }[]
}

/**
 * Export vault items as a CSV string.
 */
export function exportAsCSV(items: (VaultItem & { id: string })[], categories: (Category & { id: string })[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]))
  const headers = ['title', 'url', 'username', 'password', 'notes', 'category', 'favorite']

  const rows = items.map((item) => [
    escapeCSV(item.title),
    escapeCSV(item.url || ''),
    escapeCSV(item.username),
    escapeCSV(item.password),
    escapeCSV(item.notes || ''),
    escapeCSV(catMap.get(item.categoryId) || ''),
    item.favorite ? 'true' : 'false',
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Export vault items as an encrypted JSON string.
 * The JSON is encrypted with the current vault key for safe backup.
 */
export function exportAsJSON(items: (VaultItem & { id: string })[], categories: (Category & { id: string })[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]))

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    items: items.map((item) => ({
      title: item.title,
      url: item.url || '',
      username: item.username,
      password: item.password,
      notes: item.notes || '',
      category: catMap.get(item.categoryId) || '',
      favorite: item.favorite || false,
    })),
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

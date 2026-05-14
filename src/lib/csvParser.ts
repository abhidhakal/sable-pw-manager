import Papa from 'papaparse'
import type { ImportableField, ImportMapping, ImportPreview } from '@/types/vault'

const COLUMN_ALIASES: Record<ImportableField, string[]> = {
  username: ['email', 'username', 'user', 'login', 'account', 'e-mail', 'mail'],
  password: ['password', 'pass', 'pwd', 'secret'],
  title: ['title', 'name', 'site', 'website', 'service'],
  url: ['url', 'website', 'site', 'link', 'domain', 'uri'],
  notes: ['notes', 'note', 'description', 'comment', 'memo'],
  categoryId: ['category', 'group', 'folder', 'type'],
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_\-\s]+/g, '')
}

export function detectColumnMapping(headers: string[]): ImportMapping {
  const mapping: ImportMapping = {}
  const usedFields = new Set<ImportableField>()

  for (const header of headers) {
    const normalized = normalizeHeader(header)
    let matched = false

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [ImportableField, string[]][]) {
      if (usedFields.has(field)) continue
      if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
        mapping[header] = field
        usedFields.add(field)
        matched = true
        break
      }
    }

    if (!matched) {
      mapping[header] = null
    }
  }

  return mapping
}

export function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: 'greedy',
  })

  if (!result.data || result.data.length === 0) {
    throw new Error('CSV file is empty or could not be parsed')
  }

  const headers = result.data[0].map((h) => h.trim())
  const rows = result.data.slice(1).filter((row) => row.some((cell) => cell.trim() !== ''))

  return { headers, rows }
}

export function deriveTitle(username: string, url?: string): string {
  if (url) {
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      const parts = hostname.replace(/^www\./, '').split('.')
      const domain = parts[0]
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    } catch {
      // fall through to email derivation
    }
  }

  if (username.includes('@')) {
    const domain = username.split('@')[1]
    const name = domain.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return username
}

export function buildPreview(
  headers: string[],
  rows: string[][],
  mapping: ImportMapping,
): ImportPreview {
  const requiredFields: ImportableField[] = ['username', 'password']
  const mappedFields = new Set(
    Object.values(mapping).filter((f): f is ImportableField => f !== null),
  )
  const hasRequired = requiredFields.every((f) => mappedFields.has(f))

  let validRows = 0
  if (hasRequired) {
    for (const row of rows) {
      const username = getCellValue(row, headers, mapping, 'username')
      const password = getCellValue(row, headers, mapping, 'password')
      if (username?.trim() && password?.trim()) {
        validRows++
      }
    }
  }

  return {
    headers,
    rows,
    mapping,
    totalRows: rows.length,
    validRows,
    skippedRows: rows.length - validRows,
  }
}

function getCellValue(
  row: string[],
  headers: string[],
  mapping: ImportMapping,
  field: ImportableField,
): string | undefined {
  for (const [header, mappedField] of Object.entries(mapping)) {
    if (mappedField === field) {
      const index = headers.indexOf(header)
      if (index >= 0 && index < row.length) {
        return row[index]?.trim() || undefined
      }
    }
  }
  return undefined
}

export function csvRowsToItems(
  headers: string[],
  rows: string[][],
  mapping: ImportMapping,
  defaultCategoryId: string,
  categories?: { id: string; name: string }[],
): { username: string; password: string; title: string; url?: string; notes?: string; categoryId: string }[] {
  const items: { username: string; password: string; title: string; url?: string; notes?: string; categoryId: string }[] = []

  // Build a lookup map for category names (case-insensitive)
  const categoryByName = new Map<string, string>()
  if (categories) {
    for (const cat of categories) {
      categoryByName.set(cat.name.toLowerCase(), cat.id)
    }
  }

  for (const row of rows) {
    const username = getCellValue(row, headers, mapping, 'username')?.trim()
    const password = getCellValue(row, headers, mapping, 'password')?.trim()

    if (!username || !password) continue

    const url = getCellValue(row, headers, mapping, 'url')
    const notes = getCellValue(row, headers, mapping, 'notes')
    const titleFromCSV = getCellValue(row, headers, mapping, 'title')
    const categoryFromCSV = getCellValue(row, headers, mapping, 'categoryId')?.trim()

    const title = titleFromCSV || deriveTitle(username, url)

    // Use the CSV category if it matches an existing category, otherwise fall back to default
    let categoryId = defaultCategoryId
    if (categoryFromCSV) {
      const matchedId = categoryByName.get(categoryFromCSV.toLowerCase())
      if (matchedId) {
        categoryId = matchedId
      }
    }

    items.push({
      username,
      password,
      title,
      url: url || undefined,
      notes: notes || undefined,
      categoryId,
    })
  }

  return items
}
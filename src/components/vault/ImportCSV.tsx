import { useState, useRef } from 'react'
import { Upload, FileText, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { parseCSV, detectColumnMapping, buildPreview, csvRowsToItems } from '@/lib/csvParser'
import type { ImportableField, ImportMapping, ImportPreview } from '@/types/vault'

interface ImportCSVProps {
  open: boolean
  onClose: () => void
}

type Step = 'upload' | 'mapping' | 'importing' | 'done'

const FIELD_LABELS: Record<ImportableField, string> = {
  username: 'Username / Email',
  password: 'Password',
  title: 'Title',
  url: 'URL',
  notes: 'Notes',
  categoryId: 'Category',
}

const REQUIRED_FIELDS: ImportableField[] = ['username', 'password']

export function ImportCSV({ open, onClose }: ImportCSVProps) {
  const { categories, addItems, addCategory } = useVaultStore()
  const { user } = useAuthStore()

  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ImportMapping>({})
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importError, setImportError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({})
    setPreview(null)
    setImportProgress({ current: 0, total: 0 })
    setImportError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileSelect = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const { headers: h, rows: r } = parseCSV(text)
        setHeaders(h)
        setRows(r)
        const detected = detectColumnMapping(h)
        setMapping(detected)
        const p = buildPreview(h, r, detected)
        setPreview(p)
        setStep('mapping')
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse CSV')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileSelect(file)
    }
  }

  const handleMappingChange = (csvHeader: string, field: ImportableField | null) => {
    const newMapping: ImportMapping = { ...mapping }

    if (field) {
      for (const [header, f] of Object.entries(newMapping)) {
        if (f === field) {
          newMapping[header] = null
        }
      }
    }

    newMapping[csvHeader] = field
    setMapping(newMapping)
    setPreview(buildPreview(headers, rows, newMapping))
  }

  const handleImport = async () => {
    if (!user?.uid || !preview) return

    // Find or create the "Imported" category
    const importedCategory = categories.find((c) => c.name === 'Imported')
    let importedCategoryId = importedCategory?.id
    if (!importedCategoryId) {
      importedCategoryId = await addCategory(user.uid, {
        name: 'Imported',
        icon: 'Download',
        color: '#8B9DC3',
      })
    }

    const items = csvRowsToItems(headers, rows, mapping, importedCategoryId)

    if (items.length === 0) {
      setImportError('No valid rows to import')
      return
    }

    setStep('importing')
    setImportProgress({ current: 0, total: items.length })
    setImportError(null)

    try {
      const CHUNK_SIZE = 50
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE)
        await addItems(user.uid, chunk)
        setImportProgress({ current: Math.min(i + CHUNK_SIZE, items.length), total: items.length })
      }

      setStep('done')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const mappedFields = new Set(
    Object.values(mapping).filter((f): f is ImportableField => f !== null),
  )
  const hasRequired = REQUIRED_FIELDS.every((f) => mappedFields.has(f))

  return (
    <Modal open={open} onClose={handleClose} title="Import Passwords" size="lg">
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="text-sm text-text-primary font-medium">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-text-muted mt-1">
              Only .csv files are supported
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
          {importError && (
            <div className="flex items-center gap-2 text-danger text-sm">
              <AlertCircle size={16} />
              {importError}
            </div>
          )}
          <div className="text-xs text-text-muted space-y-1">
            <p className="font-medium">Expected columns:</p>
            <p>At minimum, your CSV should have columns for <strong>email/username</strong> and <strong>password</strong>.</p>
            <p>Other columns like title, URL, and notes are optional and can be mapped manually.</p>
          </div>
        </div>
      )}

      {step === 'mapping' && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <FileText size={16} />
            <span>{fileName} — {preview.totalRows} rows</span>
          </div>

          {/* Column mapping */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Map columns</h3>
            <p className="text-xs text-text-muted">
              Assign each CSV column to a password field. Username and password are required.
            </p>
            <div className="space-y-2 mt-3">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary w-1/3 truncate" title={header}>
                    {header}
                  </span>
                  <select
                    value={mapping[header] ?? ''}
                    onChange={(e) =>
                      handleMappingChange(header, (e.target.value || null) as ImportableField | null)
                    }
                    className="flex-1 h-9 px-3 bg-surface border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">— Skip —</option>
                    {Object.entries(FIELD_LABELS).map(([field, label]) => (
                      <option key={field} value={field}>
                        {label}
                        {REQUIRED_FIELDS.includes(field as ImportableField) ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">Preview</h3>
            <div className="text-xs text-text-muted mb-2">
              {preview.validRows} of {preview.totalRows} rows will be imported
              {preview.skippedRows > 0 && ` (${preview.skippedRows} skipped — missing username or password)`}
            </div>
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-elevated">
                    {Object.entries(mapping)
                      .filter(([, field]) => field !== null)
                      .map(([header, field]) => (
                        <th key={header} className="px-2 py-1.5 text-left text-text-muted font-medium">
                          {FIELD_LABELS[field!]}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => {
                    const username = getMappedValue(row, headers, mapping, 'username')
                    const password = getMappedValue(row, headers, mapping, 'password')
                    const isValid = username?.trim() && password?.trim()
                    return (
                      <tr key={i} className={isValid ? '' : 'opacity-40'}>
                        {Object.entries(mapping)
                          .filter(([, field]) => field !== null)
                          .map(([header, field]) => (
                            <td key={header} className="px-2 py-1.5 text-text-primary truncate max-w-32">
                              {getMappedValue(row, headers, mapping, field!) || '—'}
                            </td>
                          ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {rows.length > 5 && (
                <div className="text-xs text-text-muted text-center py-1.5 border-t border-border">
                  and {rows.length - 5} more rows...
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={reset}>
              Back
            </Button>
            <Button
              icon={<ArrowRight size={16} />}
              onClick={handleImport}
              disabled={!hasRequired || preview.validRows === 0}
            >
              Import {preview.validRows} passwords
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-sm text-text-primary font-medium">Importing passwords...</div>
            <div className="text-xs text-text-muted mt-1">
              {importProgress.current} of {importProgress.total}
            </div>
          </div>
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Check size={24} className="text-primary" />
          </div>
          <div>
            <div className="text-sm text-text-primary font-medium">Import complete</div>
            <div className="text-xs text-text-muted mt-1">
              Successfully imported {importProgress.total} passwords
            </div>
          </div>
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}

      {step !== 'upload' && step !== 'done' && step !== 'importing' && importError && (
        <div className="flex items-center gap-2 text-danger text-sm mt-2">
          <AlertCircle size={16} />
          {importError}
        </div>
      )}
    </Modal>
  )
}

function getMappedValue(
  row: string[],
  headers: string[],
  mapping: ImportMapping,
  field: ImportableField,
): string | undefined {
  for (const [header, f] of Object.entries(mapping)) {
    if (f === field) {
      const index = headers.indexOf(header)
      if (index >= 0 && index < row.length) {
        return row[index]?.trim() || undefined
      }
    }
  }
  return undefined
}
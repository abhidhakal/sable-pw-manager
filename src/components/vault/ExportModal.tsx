import { useState } from 'react'
import { Download, AlertTriangle, FileJson, FileText } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useVaultStore } from '@/stores/vaultStore'
import { exportAsCSV, exportAsJSON, downloadFile } from '@/lib/exportVault'
import { toast } from '@/components/ui/Toast'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

type ExportFormat = 'json' | 'csv'

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { items, categories } = useVaultStore()
  const [format, setFormat] = useState<ExportFormat>('json')
  const [confirmed, setConfirmed] = useState(false)

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'csv') {
      const csv = exportAsCSV(items, categories)
      downloadFile(csv, `sable-export-${timestamp}.csv`, 'text/csv')
    } else {
      const json = exportAsJSON(items, categories)
      downloadFile(json, `sable-export-${timestamp}.json`, 'application/json')
    }

    toast.success(`Exported ${items.length} passwords as ${format.toUpperCase()}`)
    setConfirmed(false)
    onClose()
  }

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Export Vault" size="sm">
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-3 rounded-md bg-warning/5 border border-warning/20">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary leading-relaxed">
            <p className="font-medium text-warning mb-1">Security Warning</p>
            <p>Exported files contain your passwords in plaintext. Store them securely and delete after use.</p>
          </div>
        </div>

        {/* Format selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-2 p-3 rounded-md border text-sm cursor-pointer transition-all ${
                format === 'json'
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border text-text-secondary hover:border-border-focus'
              }`}
            >
              <FileJson size={16} />
              <div className="text-left">
                <p className="font-medium">JSON</p>
                <p className="text-[10px] opacity-70">Re-importable</p>
              </div>
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-2 p-3 rounded-md border text-sm cursor-pointer transition-all ${
                format === 'csv'
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border text-text-secondary hover:border-border-focus'
              }`}
            >
              <FileText size={16} />
              <div className="text-left">
                <p className="font-medium">CSV</p>
                <p className="text-[10px] opacity-70">Spreadsheet compatible</p>
              </div>
            </button>
          </div>
        </div>

        {/* Item count */}
        <p className="text-xs text-text-muted">
          {items.length} password{items.length === 1 ? '' : 's'} will be exported.
        </p>

        {/* Confirmation */}
        {!confirmed ? (
          <Button fullWidth variant="outline" onClick={() => setConfirmed(true)} icon={<Download size={16} />}>
            I understand, export my data
          </Button>
        ) : (
          <Button fullWidth onClick={handleExport} icon={<Download size={16} />}>
            Download {format.toUpperCase()} File
          </Button>
        )}
      </div>
    </Modal>
  )
}

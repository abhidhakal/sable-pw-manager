import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Link2, Shield, Clock, Eye, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useSharingStore } from '@/stores/sharingStore'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'
import type { VaultItem } from '@/types/vault'
import type { ShareExpiration, ShareViewLimit } from '@/types/sharing'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  items: (VaultItem & { id: string })[]
}

const expirationOptions: { value: ShareExpiration; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
]

const viewLimitOptions: { value: ShareViewLimit; label: string; description: string }[] = [
  { value: 'once', label: 'One-time view', description: 'Link burns after first view' },
  { value: 'unlimited', label: 'Unlimited views', description: 'Anyone with link can view until expiry' },
]

export function ShareModal({ open, onClose, items }: ShareModalProps) {
  const { user } = useAuthStore()
  const { creating, generatedLink, createShareLink, clearGeneratedLink } = useSharingStore()
  const [expiration, setExpiration] = useState<ShareExpiration>('24h')
  const [viewLimit, setViewLimit] = useState<ShareViewLimit>('once')
  const [copied, setCopied] = useState(false)

  // Reset state when modal is opened fresh (transition from closed → open)
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      clearGeneratedLink()
      setCopied(false)
    }
    prevOpenRef.current = open
  }, [open, clearGeneratedLink])

  const handleGenerate = async () => {
    if (!user) return

    const shareableItems = items.map((item) => ({
      title: item.title,
      username: item.username,
      password: item.password,
      url: item.url,
      notes: item.notes,
    }))

    await createShareLink({
      uid: user.uid,
      items: shareableItems,
      expiration,
      viewLimit,
    })
  }

  const handleCopy = async () => {
    if (!generatedLink) return
    const ok = await copyToClipboard(generatedLink)
    if (ok) {
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleClose = () => {
    clearGeneratedLink()
    setCopied(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Share Passwords" size="md">
      {/* Items being shared */}
      <div className="mb-5">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
          Sharing {items.length} item{items.length === 1 ? '' : 's'}
        </p>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md"
            >
              <Shield size={14} className="text-primary shrink-0" />
              <span className="text-sm text-text-primary truncate">{item.title}</span>
              <span className="text-xs text-text-muted truncate ml-auto">{item.username}</span>
            </div>
          ))}
        </div>
      </div>

      {!generatedLink ? (
        <>
          {/* Expiration */}
          <div className="mb-4">
            <label className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={12} /> Expires after
            </label>
            <div className="flex gap-2 mt-1.5">
              {expirationOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExpiration(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border ${
                    expiration === opt.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface border-border text-text-secondary hover:border-border-focus'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* View limit */}
          <div className="mb-5">
            <label className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye size={12} /> View limit
            </label>
            <div className="space-y-2 mt-1.5">
              {viewLimitOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setViewLimit(opt.value)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors cursor-pointer border ${
                    viewLimit === opt.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface border-border hover:border-border-focus'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                      viewLimit === opt.value ? 'border-primary' : 'border-border-hover'
                    }`}
                  >
                    {viewLimit === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${viewLimit === opt.value ? 'text-primary' : 'text-text-primary'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-text-muted">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-md mb-5">
            <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Anyone with this link can view the shared credentials. Only share with people you trust.
            </p>
          </div>

          {/* Generate button */}
          <Button
            fullWidth
            icon={<Link2 size={16} />}
            onClick={handleGenerate}
            loading={creating}
          >
            Generate Share Link
          </Button>
        </>
      ) : (
        <>
          {/* Generated link */}
          <div className="mb-4">
            <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary font-mono truncate select-all">
                {generatedLink}
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Security info */}
          <div className="space-y-2 p-3 bg-surface border border-border rounded-md mb-5">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Shield size={12} className="text-success" />
              <span>End-to-end encrypted — server never sees plaintext</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Clock size={12} className="text-text-muted" />
              <span>Expires in {expirationOptions.find((o) => o.value === expiration)?.label}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Eye size={12} className="text-text-muted" />
              <span>{viewLimit === 'once' ? 'Burns after one view' : 'Unlimited views until expiry'}</span>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={handleClose}>
            Done
          </Button>
        </>
      )}
    </Modal>
  )
}

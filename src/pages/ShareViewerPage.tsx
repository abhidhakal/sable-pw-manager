import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router'
import { Shield, Copy, Check, Eye, EyeOff, Clock, AlertTriangle, Lock } from 'lucide-react'
import { decryptSharePayload, type ShareableItem } from '@/lib/sharingCrypto'
import { getSharedLink, recordView } from '@/features/sharing/sharingService'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'

const AUTO_CLEAR_SECONDS = 120 // auto-clear displayed data after 2 minutes

export default function ShareViewerPage() {
  const { linkId } = useParams<{ linkId: string }>()
  const [status, setStatus] = useState<'loading' | 'decrypting' | 'ready' | 'expired' | 'error'>('loading')
  const [items, setItems] = useState<ShareableItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(AUTO_CLEAR_SECONDS)
  const [cleared, setCleared] = useState(false)
  const [isOneTimeView, setIsOneTimeView] = useState(false)

  const decryptAndDisplay = useCallback(async () => {
    if (!linkId) {
      setError('Invalid share link')
      setStatus('error')
      return
    }

    // Get the secret from the URL fragment
    const secret = window.location.hash.slice(1)
    if (!secret) {
      setError('Missing decryption key — the link may be incomplete')
      setStatus('error')
      return
    }

    try {
      // Fetch the encrypted data from Firestore
      const link = await getSharedLink(linkId)

      if (!link) {
        setError('This share link does not exist or has been revoked')
        setStatus('expired')
        return
      }

      // Check if burned or expired
      if (link.burned) {
        setError('This link has already been viewed and is no longer available')
        setStatus('expired')
        return
      }

      const expiresAtMs = link.expiresAt?.toMillis?.() || (link.expiresAt as any)?.seconds * 1000
      if (expiresAtMs && Date.now() > expiresAtMs) {
        setError('This share link has expired')
        setStatus('expired')
        return
      }

      setStatus('decrypting')

      // Decrypt client-side
      const decryptedItems = await decryptSharePayload(
        {
          ciphertext: link.encryptedPayload,
          salt: link.salt,
          iv: link.iv,
        },
        secret,
      )

      setItems(decryptedItems)
      setStatus('ready')
      setIsOneTimeView(link.maxViews !== null && link.maxViews <= 1)

      // Record the view (and potentially burn the link)
      await recordView(linkId, link.maxViews, link.viewCount)
    } catch (err) {
      console.error('Decryption failed:', err)
      setError('Failed to decrypt — the link may be corrupted or the key is invalid')
      setStatus('error')
    }
  }, [linkId])

  useEffect(() => {
    decryptAndDisplay()
  }, [decryptAndDisplay])

  // Auto-clear countdown — only for one-time view links
  useEffect(() => {
    if (status !== 'ready' || cleared || !isOneTimeView) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setItems([])
          setCleared(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status, cleared, isOneTimeView])

  const togglePassword = (index: number) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleCopy = async (value: string, field: string) => {
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopiedField(field)
      toast.success(`${field} copied`)
      setTimeout(() => setCopiedField(null), 3000)
    }
  }

  // Loading state
  if (status === 'loading' || status === 'decrypting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-primary animate-pulse" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-1">
            {status === 'loading' ? 'Loading shared credentials...' : 'Decrypting...'}
          </h1>
          <p className="text-sm text-text-muted">End-to-end encrypted — decrypting in your browser</p>
        </div>
      </div>
    )
  }

  // Expired / error state
  if (status === 'expired' || status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-danger" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">Link Unavailable</h1>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    )
  }

  // Cleared state
  if (cleared) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-text-muted" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">Content Cleared</h1>
          <p className="text-sm text-text-muted">
            The shared credentials have been cleared from view for security.
          </p>
        </div>
      </div>
    )
  }

  // Ready — display decrypted items
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Shared Credentials</h1>
          <p className="text-sm text-text-muted mt-1">
            {items.length} item{items.length === 1 ? '' : 's'} shared securely with you
          </p>
        </div>

        {/* Auto-clear countdown — only for one-time view links */}
        {isOneTimeView && (
          <div className="flex items-center justify-center gap-2 mb-6 px-3 py-2 bg-warning/5 border border-warning/20 rounded-md">
            <Clock size={14} className="text-warning" />
            <span className="text-xs text-text-secondary">
              Content auto-clears in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Items */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-surface border border-border rounded-lg overflow-hidden"
            >
              {/* Item header */}
              <div className="px-4 py-3 border-b border-border bg-surface-elevated">
                <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary-hover truncate block mt-0.5"
                  >
                    {item.url}
                  </a>
                )}
              </div>

              {/* Fields */}
              <div className="divide-y divide-border">
                {/* Username */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Username</p>
                    <p className="text-sm text-text-primary font-mono truncate">{item.username}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(item.username, `username-${index}`)}
                    className="p-1.5 rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer ml-2"
                    title="Copy username"
                  >
                    {copiedField === `username-${index}` ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Password</p>
                    <p className="text-sm text-text-primary font-mono">
                      {visiblePasswords.has(index) ? item.password : '•'.repeat(16)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => togglePassword(index)}
                      className="p-1.5 rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      title={visiblePasswords.has(index) ? 'Hide' : 'Show'}
                    >
                      {visiblePasswords.has(index) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopy(item.password, `password-${index}`)}
                      className="p-1.5 rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      title="Copy password"
                    >
                      {copiedField === `password-${index}` ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="px-4 py-3">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Notes</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap mt-0.5">{item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            Shared via <span className="font-medium text-text-secondary">Sable</span> — zero-knowledge password manager
          </p>
        </div>
      </div>
    </div>
  )
}

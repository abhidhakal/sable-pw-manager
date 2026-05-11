import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Shield, AlertTriangle, Copy, Clock, CheckCircle } from 'lucide-react'
import { useVaultStore } from '@/stores/vaultStore'
import { analyzePasswordHealth, checkPwnedPassword } from '@/lib/passwordHealth'
import { getPasswordStrength } from '@/lib/passwordGenerator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function HealthPage() {
  const nav = useNavigate()
  const { items } = useVaultStore()
  const [breachResults, setBreachResults] = useState<Map<string, number>>(new Map())
  const [checkingBreaches, setCheckingBreaches] = useState(false)
  const [breachChecked, setBreachChecked] = useState(false)

  const report = useMemo(() => analyzePasswordHealth(items), [items])

  const healthColor = report.healthScore >= 80 ? '#7FAE82' : report.healthScore >= 50 ? '#D6A84F' : '#D96C5F'

  const handleCheckBreaches = async () => {
    setCheckingBreaches(true)
    const results = new Map<string, number>()

    // Check unique passwords only
    const uniquePasswords = new Set(items.map((i) => i.password))
    for (const pw of uniquePasswords) {
      const count = await checkPwnedPassword(pw)
      if (count > 0) {
        results.set(pw, count)
      }
      // Rate limit: 1 request per 100ms
      await new Promise((r) => setTimeout(r, 100))
    }

    setBreachResults(results)
    setCheckingBreaches(false)
    setBreachChecked(true)
  }

  const breachedItems = useMemo(() => {
    return items.filter((item) => breachResults.has(item.password))
  }, [items, breachResults])

  const reusedGroups = useMemo(() => {
    return Array.from(report.reusedPasswords.entries()).map(([, group]) => group)
  }, [report.reusedPasswords])

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-text-primary">Password Health</h2>

      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center py-6">
          <div className="relative w-20 h-20 mb-3">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={healthColor} strokeWidth="6"
                strokeDasharray={`${(report.healthScore / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold" style={{ color: healthColor }}>
              {report.healthScore}%
            </span>
          </div>
          <p className="text-xs text-text-muted">Overall Health</p>
        </Card>

        <Card className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{report.weakPasswords.length}</p>
            <p className="text-xs text-text-muted">Weak</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Copy size={18} className="text-warning" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{reusedGroups.length}</p>
            <p className="text-xs text-text-muted">Reused</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Clock size={18} className="text-secondary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{report.oldPasswords.length}</p>
            <p className="text-xs text-text-muted">Old (90+ days)</p>
          </div>
        </Card>
      </div>

      {/* Breach check */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Data Breach Check</h3>
              <p className="text-xs text-text-muted">Check passwords against known breaches (privacy-safe, uses k-anonymity)</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={breachChecked ? 'secondary' : 'primary'}
            onClick={handleCheckBreaches}
            loading={checkingBreaches}
            icon={breachChecked ? <CheckCircle size={14} /> : <Shield size={14} />}
          >
            {checkingBreaches ? 'Checking...' : breachChecked ? `${breachedItems.length} found` : 'Check Now'}
          </Button>
        </div>
        {breachChecked && breachedItems.length > 0 && (
          <div className="space-y-2 mt-3">
            {breachedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => nav(`/app/vault/${item.id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-danger/5 border border-danger/15 cursor-pointer hover:bg-danger/10 transition-colors"
              >
                <span className="text-sm text-text-primary">{item.title}</span>
                <Badge color="#D96C5F">
                  seen {breachResults.get(item.password)?.toLocaleString()} times
                </Badge>
              </div>
            ))}
          </div>
        )}
        {breachChecked && breachedItems.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-success mt-2">
            <CheckCircle size={16} />
            No passwords found in known breaches
          </div>
        )}
      </Card>

      {/* Weak passwords */}
      {report.weakPasswords.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-danger" />
            <h3 className="text-sm font-semibold text-text-primary">Weak Passwords ({report.weakPasswords.length})</h3>
          </div>
          <div className="space-y-2">
            {report.weakPasswords.map((item) => {
              const strength = getPasswordStrength(item.password)
              return (
                <div
                  key={item.id}
                  onClick={() => nav(`/app/vault/${item.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <span className="text-sm text-text-primary">{item.title}</span>
                  <Badge color={strength.color}>{strength.label}</Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Reused passwords */}
      {reusedGroups.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Copy size={18} className="text-warning" />
            <h3 className="text-sm font-semibold text-text-primary">Reused Passwords ({reusedGroups.length} groups)</h3>
          </div>
          <div className="space-y-3">
            {reusedGroups.map((group, gi) => (
              <div key={gi} className="p-3 rounded-md bg-surface border border-border">
                <p className="text-xs text-text-muted mb-2">{group.length} items share the same password:</p>
                <div className="space-y-1">
                  {group.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => nav(`/app/vault/${item.id}`)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-elevated transition-colors cursor-pointer"
                    >
                      <span className="text-sm text-text-primary">{item.title}</span>
                      <span className="text-xs text-text-muted">({item.username})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Old passwords */}
      {report.oldPasswords.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Clock size={18} className="text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Old Passwords ({report.oldPasswords.length})</h3>
          </div>
          <div className="space-y-2">
            {report.oldPasswords.map((item) => (
              <div
                key={item.id}
                onClick={() => nav(`/app/vault/${item.id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <span className="text-sm text-text-primary">{item.title}</span>
                <span className="text-xs text-text-muted">Not updated in 90+ days</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All good */}
      {report.healthScore === 100 && (
        <Card className="text-center py-8">
          <CheckCircle size={40} className="text-success mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary">All passwords are strong and unique</p>
          <p className="text-xs text-text-muted mt-1">Your vault is in great shape</p>
        </Card>
      )}
    </div>
  )
}

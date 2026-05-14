import { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, User, Key, FolderOpen, Plus, Pencil, Trash2, AlertTriangle, Sun, Moon, Lock as LockIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useThemeStore } from '@/stores/themeStore'
import { auth } from '@/lib/firebase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SupportCard } from '@/components/ui/SupportCard'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { ChangeMasterPassword } from '@/components/vault/ChangeMasterPassword'
import { toast } from '@/components/ui/Toast'
import type { CategoryFormData } from '@/schemas/vaultSchemas'

function getCatIcon(name: string): LucideIcon {
  return (Icons as any)[name] || Icons.Folder
}

export default function SettingsPage() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { categories, addCategory, updateCategory, deleteCategory, lockVault, clearVault } = useVaultStore()
  const { theme, setTheme } = useThemeStore()
  const [showAddCat, setShowAddCat] = useState(false)
  const [editCat, setEditCat] = useState<(typeof categories)[0] | null>(null)
  const [deleteCat, setDeleteCat] = useState<(typeof categories)[0] | null>(null)
  const [catLoading, setCatLoading] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [showChangeAccountPw, setShowChangeAccountPw] = useState(false)
  const [currentAccountPw, setCurrentAccountPw] = useState('')
  const [newAccountPw, setNewAccountPw] = useState('')
  const [confirmAccountPw, setConfirmAccountPw] = useState('')
  const [accountPwLoading, setAccountPwLoading] = useState(false)
  const [accountPwError, setAccountPwError] = useState<string | null>(null)

  const handleChangeAccountPassword = async () => {
    setAccountPwError(null)

    if (newAccountPw.length < 6) {
      setAccountPwError('New password must be at least 6 characters')
      return
    }
    if (newAccountPw !== confirmAccountPw) {
      setAccountPwError('Passwords do not match')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser || !currentUser.email) return

    setAccountPwLoading(true)
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentAccountPw)
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, newAccountPw)
      toast.success('Account password changed')
      setShowChangeAccountPw(false)
      setCurrentAccountPw('')
      setNewAccountPw('')
      setConfirmAccountPw('')
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setAccountPwError('Current password is incorrect')
      } else {
        setAccountPwError('Failed to change password. Try signing out and back in.')
      }
    } finally {
      setAccountPwLoading(false)
    }
  }

  const handleLogout = async () => {
    clearVault()
    await logout()
    nav('/login', { replace: true })
  }

  const handleLock = () => {
    lockVault()
    nav('/unlock')
  }

  const handleAddCategory = async (data: CategoryFormData) => {
    if (!user) return
    setCatLoading(true)
    try {
      await addCategory(user.uid, data)
      setShowAddCat(false)
    } catch { /* toast shown by store */ } finally { setCatLoading(false) }
  }

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!user || !editCat) return
    setCatLoading(true)
    try {
      await updateCategory(user.uid, editCat.id, data)
      setEditCat(null)
    } catch { /* toast shown by store */ } finally { setCatLoading(false) }
  }

  const handleDeleteCategory = async () => {
    if (!user || !deleteCat) return
    setCatLoading(true)
    try {
      await deleteCategory(user.uid, deleteCat.id)
      setDeleteCat(null)
    } catch { /* toast shown by store */ } finally { setCatLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Settings</h2>

      {/* Account */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Account</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-text-primary">Email</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" icon={<Key size={14} />} onClick={() => setShowChangePw(true)}>Change Master Password</Button>
            <Button variant="secondary" size="sm" icon={<LockIcon size={14} />} onClick={() => setShowChangeAccountPw(true)}>Change Account Password</Button>
            <Button variant="secondary" size="sm" icon={<Icons.Lock size={14} />} onClick={handleLock}>Lock Vault</Button>
          </div>
        </div>
      </Card>

      {/* Appearance + Support row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-surface border border-border rounded-xl flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <Sun size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Appearance</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1">
            Choose your preferred theme. Sable looks great in both.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer transition-all ${
                theme === 'light'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-secondary hover:border-border-focus'
              }`}
            >
              <Sun size={13} />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-secondary hover:border-border-focus'
              }`}
            >
              <Moon size={13} />
              Dark
            </button>
          </div>
        </div>

        <SupportCard />
      </div>

      {/* Categories */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FolderOpen size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Categories</h3>
          </div>
          <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setShowAddCat(true)}>
            Add
          </Button>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => {
            const Icon = getCatIcon(cat.icon)
            return (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-elevated transition-colors group">
                <span className="flex items-center gap-2.5 text-sm text-text-primary">
                  <Icon size={15} style={{ color: cat.color }} /> {cat.name}
                  {cat.isDefault && <span className="text-[10px] text-text-muted">(default)</span>}
                </span>
                {!cat.isDefault && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditCat(cat)} className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteCat(cat)} className="p-1 rounded text-text-muted hover:text-danger cursor-pointer"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-danger" />
          <h3 className="text-sm font-semibold text-text-primary">Danger Zone</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Sign Out</p>
              <p className="text-xs text-text-muted">Lock vault and sign out of your account</p>
            </div>
            <Button variant="danger" size="sm" icon={<LogOut size={14} />} onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </Card>

      {/* Change master password modal */}
      <ChangeMasterPassword open={showChangePw} onClose={() => setShowChangePw(false)} />

      {/* Change account password modal */}
      <Modal open={showChangeAccountPw} onClose={() => { setShowChangeAccountPw(false); setAccountPwError(null) }} title="Change Account Password" size="sm">
        <div className="space-y-3">
          {accountPwError && (
            <div className="p-3 rounded-md bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger">{accountPwError}</p>
            </div>
          )}
          <Input
            type="password"
            placeholder="Current password"
            value={currentAccountPw}
            onChange={(e) => setCurrentAccountPw(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New password"
            value={newAccountPw}
            onChange={(e) => setNewAccountPw(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmAccountPw}
            onChange={(e) => setConfirmAccountPw(e.target.value)}
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setShowChangeAccountPw(false); setAccountPwError(null) }}>Cancel</Button>
            <Button fullWidth loading={accountPwLoading} onClick={handleChangeAccountPassword} disabled={!currentAccountPw || !newAccountPw || !confirmAccountPw}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add category modal */}
      <Modal open={showAddCat} onClose={() => setShowAddCat(false)} title="New Category" size="sm">
        <CategoryForm onSubmit={handleAddCategory} loading={catLoading} onCancel={() => setShowAddCat(false)} />
      </Modal>

      {/* Edit category modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Category" size="sm">
        {editCat && (
          <CategoryForm initialData={{ name: editCat.name, icon: editCat.icon, color: editCat.color }} onSubmit={handleUpdateCategory} loading={catLoading} onCancel={() => setEditCat(null)} />
        )}
      </Modal>

      {/* Delete category confirm */}
      <Modal open={!!deleteCat} onClose={() => setDeleteCat(null)} title="Delete Category" size="sm">
        <p className="text-sm text-text-secondary mb-4">Delete <strong>{deleteCat?.name}</strong>? Items in this category won't be deleted but will become uncategorized.</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setDeleteCat(null)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={catLoading} onClick={handleDeleteCategory}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

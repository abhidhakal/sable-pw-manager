import { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, Shield, Key, FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PasswordGenerator } from '@/components/vault/PasswordGenerator'
import { CategoryForm } from '@/components/categories/CategoryForm'
import type { CategoryFormData } from '@/schemas/vaultSchemas'

function getCatIcon(name: string): LucideIcon {
  return (Icons as any)[name] || Icons.Folder
}

export default function SettingsPage() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { categories, addCategory, updateCategory, deleteCategory, lockVault, clearVault } = useVaultStore()
  const [showAddCat, setShowAddCat] = useState(false)
  const [editCat, setEditCat] = useState<(typeof categories)[0] | null>(null)
  const [deleteCat, setDeleteCat] = useState<(typeof categories)[0] | null>(null)
  const [catLoading, setCatLoading] = useState(false)

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
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Settings</h2>

      {/* Account */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Account</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-text-primary">Email</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Key size={14} />} onClick={handleLock}>Lock Vault</Button>
            <Button variant="danger" size="sm" icon={<LogOut size={14} />} onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </Card>

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

      {/* Password Generator */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Key size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Password Generator</h3>
        </div>
        <PasswordGenerator />
      </Card>

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

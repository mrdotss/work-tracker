"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Edit, Trash2, Search, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CheckItem } from "@/types/types"


export function CheckItemsManagement() {
  const [checkItems, setCheckItems] = useState<CheckItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CheckItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    label: "",
    sort_order: 1,
    is_active: true,
  })

  useEffect(() => {
    fetchCheckItems()
  }, [])

  const fetchCheckItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/check-items')

      if (!response.ok) {
        throw new Error('Failed to fetch check items')
      }

      const data = await response.json()
      setCheckItems(data)
    } catch (error) {
      console.error('Error fetching check items:', error)
      toast.error('Failed to load check items')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.code || !formData.label) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/check-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create check item')
      }

      const newItem = await response.json()
      setCheckItems(prev => [...prev, newItem].sort((a, b) => a.sort_order - b.sort_order))
      setIsCreateDialogOpen(false)
      setFormData({ code: "", label: "", sort_order: 1, is_active: true })
      toast.success('Check item created successfully')
    } catch (error) {
      console.error('Error creating check item:', error)
      toast.error('Failed to create check item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedItem || !formData.code || !formData.label) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/check-items/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update check item')
      }

      const updatedItem = await response.json()
      setCheckItems(prev => prev.map(item =>
        item.id === selectedItem.id ? updatedItem : item
      ).sort((a, b) => a.sort_order - b.sort_order))
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      setFormData({ code: "", label: "", sort_order: 1, is_active: true })
      toast.success('Check item updated successfully')
    } catch (error) {
      console.error('Error updating check item:', error)
      toast.error('Failed to update check item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: CheckItem) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/check-items/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete check item')
      }

      setCheckItems(prev => prev.filter(i => i.id !== item.id))
      setIsDeleteDialogOpen(false)
      setSelectedItem(null)
      toast.success('Check item deleted successfully')
    } catch (error) {
      console.error('Error deleting check item:', error)
      toast.error('Failed to delete check item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (item: CheckItem) => {
    try {
      const response = await fetch(`/api/admin/check-items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          is_active: !item.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update check item status')
      }

      const updatedItem = await response.json()
      setCheckItems(prev => prev.map(i =>
        i.id === item.id ? updatedItem : i
      ))
      toast.success(`Check item ${!item.is_active ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating check item status:', error)
      toast.error('Failed to update check item status')
    }
  }

  const handleReorder = async (item: CheckItem, direction: 'up' | 'down') => {
    const currentIndex = checkItems.findIndex(i => i.id === item.id)
    if (currentIndex === -1) return

    const newOrder = direction === 'up' ? item.sort_order - 1 : item.sort_order + 1
    if (newOrder < 1) return

    try {
      const response = await fetch(`/api/admin/check-items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          sort_order: newOrder,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder check item')
      }

      // Refresh the list to get updated sort orders
      fetchCheckItems()
      toast.success('Check item reordered successfully')
    } catch (error) {
      console.error('Error reordering check item:', error)
      toast.error('Failed to reorder check item')
    }
  }

  const openEditDialog = (item: CheckItem) => {
    setSelectedItem(item)
    setFormData({
      code: item.code,
      label: item.label,
      sort_order: item.sort_order,
      is_active: item.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: CheckItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const filteredItems = checkItems.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.label.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive = showInactive ? true : item.is_active
    return matchesSearch && matchesActive
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checklist Pengecekan Keseluruhan</CardTitle>
          <CardDescription>
            Kelola item checklist inspeksi harian dan urutannya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari Checklist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive">Tampilkan Tidak Aktif</Label>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Checklist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Checklist Item Baru</DialogTitle>
                    <DialogDescription>
                      Tambahkan item baru ke dalam checklist inspeksi harian.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="Enter item code (e.g., CHK01)"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="label">Label</Label>
                      <Input
                        id="label"
                        value={formData.label}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Enter item description (e.g., Check engine oil)"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="sort_order">Atur Urutan</Label>
                      <Input
                        id="sort_order"
                        type="number"
                        min="1"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                        placeholder="Display order"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Aktif</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setFormData({ code: "", label: "", sort_order: 1, is_active: true })
                      }}
                    >
                      Batal
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Membuat...
                        </>
                      ) : (
                        "Buat Checklist"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No check items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{item.sort_order}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleReorder(item, 'up')}
                              disabled={item.sort_order === 1}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleReorder(item, 'down')}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                              checked={item.is_active}
                              onCheckedChange={() => handleToggleActive(item)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Checklist Item</DialogTitle>
            <DialogDescription>
              {`Ubah detail checklist item "${selectedItem?.label}"…`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Enter item code"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Enter item description"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-sort_order">Sort Order</Label>
              <Input
                id="edit-sort_order"
                type="number"
                min="1"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                placeholder="Display order"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedItem(null)
                setFormData({ code: "", label: "", sort_order: 1, is_active: true })
              }}
            >
              Batal
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                "Ubah Checklist"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Checklist Item</DialogTitle>
            <DialogDescription>
              Apakah anda yakin ingin menghapus &quot;{selectedItem?.code} - {selectedItem?.label}&quot;? Aksi ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedItem(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleDelete(selectedItem)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Checklist"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

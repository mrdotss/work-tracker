"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Edit, Trash2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Unit } from "@/types/types"

export function UnitsManagement() {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    type: "",
  })

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/units')

      if (!response.ok) {
        throw new Error('Failed to fetch units')
      }

      const data = await response.json()
      setUnits(data)
    } catch (error) {
      console.error('Error fetching units:', error)
      toast.error('Failed to load units')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create unit')
      }

      const newUnit = await response.json()
      setUnits(prev => [...prev, newUnit])
      setIsCreateDialogOpen(false)
      setFormData({ name: "", type: "" })
      toast.success('Unit created successfully')
    } catch (error) {
      console.error('Error creating unit:', error)
      toast.error('Failed to create unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedUnit || !formData.name || !formData.type) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/units/${selectedUnit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update unit')
      }

      const updatedUnit = await response.json()
      setUnits(prev => prev.map(unit =>
        unit.id === selectedUnit.id ? updatedUnit : unit
      ))
      setIsEditDialogOpen(false)
      setSelectedUnit(null)
      setFormData({ name: "", type: "" })
      toast.success('Unit updated successfully')
    } catch (error) {
      console.error('Error updating unit:', error)
      toast.error('Failed to update unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (unit: Unit) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/units/${unit.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete unit')
      }

      // Update local state to mark as deleted
      setUnits(prev => prev.map(u =>
        u.id === unit.id ? { ...u, is_deleted: true } : u
      ))
      setIsDeleteDialogOpen(false)
      setSelectedUnit(null)
      toast.success('Unit deleted successfully')
    } catch (error) {
      console.error('Error deleting unit:', error)
      toast.error('Failed to delete unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestore = async (unit: Unit) => {
    try {
      const response = await fetch(`/api/admin/units/${unit.id}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore unit')
      }

      // Update local state to mark as restored
      setUnits(prev => prev.map(u =>
        u.id === unit.id ? { ...u, is_deleted: false } : u
      ))
      toast.success('Unit restored successfully')
    } catch (error) {
      console.error('Error restoring unit:', error)
      toast.error('Failed to restore unit')
    }
  }

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit)
    setFormData({
      name: unit.name,
      type: unit.type,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsDeleteDialogOpen(true)
  }

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDeleted = showDeleted ? unit.is_deleted : !unit.is_deleted
    return matchesSearch && matchesDeleted
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
          <CardTitle>Units Overview</CardTitle>
          <CardDescription>
            Manage vehicle units in your fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showDeleted ? "default" : "outline"}
                onClick={() => setShowDeleted(!showDeleted)}
              >
                {showDeleted ? "Show Active" : "Show Deleted"}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Unit</DialogTitle>
                    <DialogDescription>
                      Add a new vehicle unit to your fleet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Unit Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter unit name (e.g., Truck-001)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Unit Type</Label>
                      <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="Enter unit type (e.g., Excavator, Bulldozer)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setFormData({ name: "", type: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Unit"
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No units found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.type}</TableCell>
                      <TableCell>
                        <Badge variant={unit.is_deleted ? "destructive" : "default"}>
                          {unit.is_deleted ? "Deleted" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {unit.is_deleted ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(unit)}
                            >
                              Restore
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(unit)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(unit)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>
              Update the unit information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Unit Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter unit name"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Unit Type</Label>
              <Input
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Enter unit type"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedUnit(null)
                setFormData({ name: "", type: "" })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Unit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedUnit?.name}&quot;? This action will soft delete the unit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedUnit(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUnit && handleDelete(selectedUnit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Unit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, CreateUserForm, UpdateUserForm } from '@/types/types';
import { Plus, Edit, UserX, UserCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StaffManagementProps {
  users: User[];
  onRefresh: () => void;
}

export function StaffManagement({ users, onRefresh }: StaffManagementProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [newUser, setNewUser] = useState<CreateUserForm>({
    first_name: '',
    last_name: '',
    username: '',
    phone_number: '',
    role: 'STAFF',
    temporary_password: '',
  });

  const [editUser, setEditUser] = useState<UpdateUserForm>({
    first_name: '',
    last_name: '',
    username: '',
    phone_number: '',
    role: 'STAFF',
    reset_password: false,
    new_password: '',
  });

  // Create user
  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toast.success('User created successfully');
        setIsCreateUserOpen(false);
        setNewUser({
          first_name: '',
          last_name: '',
          username: '',
          phone_number: '',
          role: 'STAFF',
          temporary_password: '',
        });
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser),
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setEditingUser(null);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(
          `User ${currentStatus ? 'deactivated' : 'activated'} successfully`,
        );
        onRefresh();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Error toggling user status:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Staff User</DialogTitle>
              <DialogDescription>
                Create a new staff member with a temporary password
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="email"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={newUser.phone_number}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone_number: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'STAFF' | 'ADMIN') =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="temporary_password">Temporary Password</Label>
                <Input
                  id="temporary_password"
                  type="password"
                  value={newUser.temporary_password}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      temporary_password: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleCreateUser} className="w-full">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Users</CardTitle>
          <CardDescription>Manage your staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users
                .filter(
                  (user) =>
                    (selectedRole === 'all' || user.role === selectedRole) &&
                    (user.first_name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                      user.last_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      user.username
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())),
                )
                .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      {user.phone_number && (
                        <div className="text-sm text-muted-foreground">
                          {user.phone_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === 'ADMIN' ? 'default' : 'secondary'
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.last_login)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          user.is_active ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setEditUser({
                              first_name: user.first_name,
                              last_name: user.last_name,
                              username: user.username,
                              phone_number: user.phone_number || '',
                              role: user.role,
                              reset_password: false,
                              new_password: '',
                            });
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={session?.user?.id === user.id}
                          onClick={() =>
                            toggleUserStatus(user.id, user.is_active)
                          }
                          title={
                            session?.user?.id === user.id
                              ? 'You cannot deactivate your own account'
                              : ''
                          }
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={editUser.first_name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, first_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={editUser.last_name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit_username">Username</Label>
              <Input
                id="edit_username"
                type="email"
                value={editUser.username}
                onChange={(e) =>
                  setEditUser({ ...editUser, username: e.target.value })
                }
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit_phone_number">Phone Number</Label>
              <Input
                id="edit_phone_number"
                value={editUser.phone_number}
                onChange={(e) =>
                  setEditUser({ ...editUser, phone_number: e.target.value })
                }
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: 'STAFF' | 'ADMIN') =>
                  setEditUser({ ...editUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 grid gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reset_password"
                  checked={editUser.reset_password}
                  onCheckedChange={(checked) =>
                    setEditUser({
                      ...editUser,
                      reset_password: checked === true,
                    })
                  }
                />
                <Label htmlFor="reset_password">Reset Password</Label>
              </div>
              {editUser.reset_password && (
                <div className="grid gap-3">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={editUser.new_password}
                    onChange={(e) =>
                      setEditUser({ ...editUser, new_password: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
            <Button onClick={handleUpdateUser} className="w-full">
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

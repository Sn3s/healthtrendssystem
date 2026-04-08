import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email?: string;
  full_name: string | null;
  contact_number: string | null;
  patient_number: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles: string[];
  departmentId: string | null;
  departmentName: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    contact_number: '',
    patient_number: '',
    roles: [] as string[],
    departmentId: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Fetch all departments
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (deptsError) throw deptsError;
      setDepartments(depts || []);

      // Create a map of department IDs to names
      const deptMap = new Map(depts?.map(d => [d.id, d.name]) || []);

      // Fetch all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role, department')
            .eq('user_id', profile.id);

          const departmentId = roles?.find(r => r.role === 'doctor')?.department || null;
          const departmentName = departmentId ? deptMap.get(departmentId) || null : null;

          return {
            ...profile,
            roles: roles?.map(r => r.role) || [],
            departmentId,
            departmentName,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          contact_number: formData.contact_number,
          patient_number: formData.patient_number,
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Get current roles
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', editingUser.id);

      const currentRoleNames = (currentRoles?.map(r => r.role) || []) as string[];

      // Determine roles to add and remove
      const rolesToAdd = formData.roles.filter(r => !currentRoleNames.includes(r));
      const rolesToRemove = currentRoleNames.filter(r => !formData.roles.includes(r));

      // Add new roles
      if (rolesToAdd.length > 0) {
        const newRoles = rolesToAdd.map(role => ({
          user_id: editingUser.id,
          role: role as 'admin' | 'doctor' | 'encoder' | 'patient',
          department: role === 'doctor' ? (formData.departmentId || null) : null,
        }));

        const { error: addError } = await supabase
          .from('user_roles')
          .insert(newRoles);

        if (addError) throw addError;
      }

      // Remove old roles
      if (rolesToRemove.length > 0) {
        await Promise.all(
          rolesToRemove.map(role =>
            supabase
              .from('user_roles')
              .delete()
              .eq('user_id', editingUser.id)
              .eq('role', role as 'admin' | 'doctor' | 'encoder' | 'patient')
          )
        );
      }

      // Update doctor department if needed
      if (formData.roles.includes('doctor')) {
        const { error: deptError } = await supabase
          .from('user_roles')
          .update({ department: formData.departmentId || null })
          .eq('user_id', editingUser.id)
          .eq('role', 'doctor');

        if (deptError) throw deptError;
      }

      toast({
        title: 'User Updated',
        description: `${formData.full_name} has been updated successfully`,
      });

      setIsDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This will remove all their roles.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Roles Removed',
        description: `All roles for ${userName} have been removed`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      contact_number: user.contact_number || '',
      patient_number: user.patient_number || '',
      roles: user.roles,
      departmentId: user.departmentId || '',
    });
    setIsDialogOpen(true);
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <div className="max-h-[min(480px,65vh)] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Patient #</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.departmentName || 'N/A'}</TableCell>
                  <TableCell>{user.patient_number || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email (read-only)</Label>
              <Input value={editingUser?.email} disabled />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Patient Number (for patient role)</Label>
              <Input
                value={formData.patient_number}
                onChange={(e) => setFormData({ ...formData, patient_number: e.target.value })}
                placeholder="P-000001"
              />
            </div>
            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['admin', 'encoder', 'doctor', 'patient'].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={formData.roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <label htmlFor={role} className="text-sm capitalize cursor-pointer">
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {formData.roles.includes('doctor') && (
              <div>
                <Label>Department</Label>
                <Select 
                  value={formData.departmentId} 
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Mail, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
  lastLogin: string | null;
}

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to everything' },
  { value: 'manager', label: 'Manager', description: 'Can manage most features' },
  { value: 'staff', label: 'Staff', description: 'Limited access' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

const PERMISSIONS = [
  { id: 'view_transactions', label: 'View Transactions' },
  { id: 'create_transactions', label: 'Create Transactions' },
  { id: 'refund_transactions', label: 'Refund Transactions' },
  { id: 'view_customers', label: 'View Customers' },
  { id: 'manage_customers', label: 'Manage Customers' },
  { id: 'view_invoices', label: 'View Invoices' },
  { id: 'manage_invoices', label: 'Manage Invoices' },
  { id: 'view_products', label: 'View Products' },
  { id: 'manage_products', label: 'Manage Products' },
  { id: 'view_reports', label: 'View Reports' },
  { id: 'manage_team', label: 'Manage Team' },
  { id: 'manage_settings', label: 'Manage Settings' },
];

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'staff',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role,
        permissions: member.permissions || [],
      });
    } else {
      setEditingMember(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'staff',
        permissions: [],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const url = editingMember ? `/api/team/${editingMember.id}` : '/api/team';
      const method = editingMember ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        setShowModal(false);
        fetchTeamMembers();
      } else {
        alert('Failed to save team member');
      }
    } catch (error) {
      alert('Error saving team member');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchTeamMembers();
      } else {
        alert('Failed to remove team member');
      }
    } catch (error) {
      alert('Error removing team member');
    }
  };

  const handleResendInvitation = async (memberId: number) => {
    try {
      const response = await fetch(`/api/team/${memberId}/resend-invitation`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Invitation sent successfully');
      } else {
        alert('Failed to send invitation');
      }
    } catch (error) {
      alert('Error sending invitation');
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  if (loading && teamMembers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-gray-600">
            Manage team members and their permissions
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No team members yet</p>
              <Button onClick={() => handleOpenModal()} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Invite Your First Team Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                          {ROLES.find(r => r.value === member.role)?.label || member.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {member.permissions?.length || 0} permissions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResendInvitation(member.id)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(member)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingMember}
                required
              />
              {!editingMember && (
                <p className="text-xs text-gray-500">
                  An invitation with login credentials will be sent to this email
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Permissions</label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={permission.id} className="text-sm">
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Role-based permissions are applied automatically. Add custom permissions if needed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.firstName || !formData.lastName || !formData.email}
            >
              {editingMember ? 'Update' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


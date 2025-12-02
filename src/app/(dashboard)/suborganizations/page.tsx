'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Building, MapPin, Phone, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Suborganization {
  id: number;
  name: string;
  address: string;
  phone: string;
  pastor: string;
  description: string;
  organization: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export default function SuborganizationsPage() {
  const [suborganizations, setSuborganizations] = useState<Suborganization[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSuborg, setEditingSuborg] = useState<Suborganization | null>(null);
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    address: '',
    phone: '',
    pastor: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suborgsRes, orgsRes] = await Promise.all([
        fetch('/api/suborganizations', { credentials: 'include' }),
        fetch('/api/organizations', { credentials: 'include' }),
      ]);

      if (suborgsRes.ok) {
        const data = await suborgsRes.json();
        setSuborganizations(data.suborganizations || []);
      }

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0 && !formData.organizationId) {
          setFormData(prev => ({ ...prev, organizationId: data.organizations[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (suborg?: Suborganization) => {
    if (suborg) {
      setEditingSuborg(suborg);
      setFormData({
        organizationId: suborg.organization.id.toString(),
        name: suborg.name,
        address: suborg.address,
        phone: suborg.phone,
        pastor: suborg.pastor,
        description: suborg.description,
      });
    } else {
      setEditingSuborg(null);
      setFormData({
        organizationId: organizations[0]?.id?.toString() || '',
        name: '',
        address: '',
        phone: '',
        pastor: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const url = editingSuborg ? `/api/suborganizations/${editingSuborg.id}` : '/api/suborganizations';
      const method = editingSuborg ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: parseInt(formData.organizationId),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      } else {
        alert('Failed to save suborganization');
      }
    } catch (error) {
      alert('Error saving suborganization');
    } finally {
      setLoading(false);
    }
  };

  if (loading && suborganizations.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Suborganizations</h1>
          <p className="mt-2 text-gray-600">
            Manage locations, campuses, or departments
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Suborganization
        </Button>
      </div>

      {suborganizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suborganizations yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Add campuses, locations, or departments to organize your operations
            </p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Suborganization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suborganizations.map((suborg) => (
            <Card key={suborg.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  {suborg.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <span className="text-gray-600">{suborg.address}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{suborg.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{suborg.pastor}</span>
                </div>
                
                <p className="text-sm text-gray-500">{suborg.description}</p>
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    Parent: {suborg.organization.name}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleOpenModal(suborg)}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSuborg ? 'Edit Suborganization' : 'Add Suborganization'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Organization *</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300"
                value={formData.organizationId}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                disabled={!!editingSuborg}
                required
              >
                <option value="">Select organization...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Downtown Campus"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address *</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Leader/Pastor *</label>
                <Input
                  value={formData.pastor}
                  onChange={(e) => setFormData({ ...formData, pastor: e.target.value })}
                  placeholder="Pastor Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this location..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.address || !formData.phone || !formData.pastor || !formData.description}
            >
              {editingSuborg ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


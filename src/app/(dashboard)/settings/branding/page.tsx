'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

export default function BrandingPage() {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    organizationId: '',
    logo: null as File | null,
    logoPreview: '',
    themeColor: '#5469d4',
    backgroundColor: '#ffffff',
    buttonTextColor: '#ffffff',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0) {
          setFormData(prev => ({ ...prev, organizationId: data.organizations[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB max
        alert('Logo file size must be less than 500KB');
        return;
      }
      setFormData({ ...formData, logo: file, logoPreview: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement branding save API
      alert('Branding settings saved! (API not yet implemented)');
    } catch (error) {
      alert('Error saving branding settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Branding & Customization</h1>
        <p className="mt-2 text-gray-600">
          Customize your brand across all customer-facing products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Brand Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization *</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    required
                  >
                    <option value="">Select organization...</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.logoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={formData.logoPreview}
                          alt="Logo preview"
                          className="max-h-32 mx-auto"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, logo: null, logoPreview: '' })}
                        >
                          Remove Logo
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleLogoChange}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
                        >
                          Click to upload logo
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG up to 500KB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.themeColor}
                        onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={formData.themeColor}
                        onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Button Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.buttonTextColor}
                      onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                      className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.buttonTextColor}
                      onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Saving...' : 'Save Branding Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg p-6 space-y-4"
                style={{ backgroundColor: formData.backgroundColor }}
              >
                {formData.logoPreview && (
                  <div className="text-center">
                    <img
                      src={formData.logoPreview}
                      alt="Logo"
                      className="max-h-16 mx-auto"
                    />
                  </div>
                )}
                
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">Invoice #IN00000-0001</h2>
                  <p className="text-sm text-gray-600">Due: January 15, 2024</p>
                </div>

                <div className="border-t border-b py-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Product 1</span>
                    <span>$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Product 2</span>
                    <span>$15.00</span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>$25.00</span>
                </div>

                <Button
                  className="w-full"
                  style={{
                    backgroundColor: formData.themeColor,
                    color: formData.buttonTextColor,
                  }}
                >
                  Pay Invoice
                </Button>

                <div className="text-center text-xs text-gray-500">
                  <p>Company Name</p>
                  <p>https://example.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



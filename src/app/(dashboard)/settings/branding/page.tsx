'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Check, Palette } from 'lucide-react';

// Preset color schemes
const colorPresets = [
  { name: 'Default Black', primary: '#000000', background: '#ffffff', buttonText: '#ffffff' },
  { name: 'Ocean Blue', primary: '#0066cc', background: '#f0f7ff', buttonText: '#ffffff' },
  { name: 'Forest Green', primary: '#228B22', background: '#f0fff0', buttonText: '#ffffff' },
  { name: 'Royal Purple', primary: '#663399', background: '#f5f0ff', buttonText: '#ffffff' },
  { name: 'Sunset Orange', primary: '#ff6600', background: '#fff8f0', buttonText: '#ffffff' },
  { name: 'Rose Gold', primary: '#b76e79', background: '#fff5f5', buttonText: '#ffffff' },
];

export default function BrandingPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    organizationId: '',
    logo: null as File | null,
    logoPreview: '',
    existingLogo: '',
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    buttonTextColor: '#ffffff',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (formData.organizationId) {
      fetchBranding();
    }
  }, [formData.organizationId]);

  const fetchOrganizations = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchBranding = async () => {
    try {
      const response = await fetch(`/api/organizations/${formData.organizationId}/branding`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          primaryColor: data.branding.primaryColor || '#000000',
          backgroundColor: data.branding.backgroundColor || '#ffffff',
          buttonTextColor: data.branding.buttonTextColor || '#ffffff',
          existingLogo: data.branding.logo || '',
          logoPreview: data.branding.logo || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('Logo file size must be less than 500KB');
        return;
      }
      setFormData({ ...formData, logo: file, logoPreview: URL.createObjectURL(file) });
    }
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      backgroundColor: preset.background,
      buttonTextColor: preset.buttonText,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      let logoBase64: string | undefined;
      let logoFileName: string | undefined;

      // Convert file to base64 if new logo selected
      if (formData.logo) {
        const reader = new FileReader();
        logoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.logo!);
        });
        logoFileName = formData.logo.name;
      }

      const response = await fetch(`/api/organizations/${formData.organizationId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: formData.primaryColor,
          backgroundColor: formData.backgroundColor,
          buttonTextColor: formData.buttonTextColor,
          logoBase64,
          logoFileName,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          existingLogo: data.branding.logo || '',
          logoPreview: data.branding.logo || '',
          logo: null,
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save branding settings');
      }
    } catch (error) {
      console.error('Save branding error:', error);
      alert('Error saving branding settings');
    } finally {
      setSaving(false);
    }
  };

  const selectedOrg = organizations.find(o => o.id.toString() === formData.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branding & Customization</h1>
        <p className="mt-1 text-muted-foreground">
          Customize your brand colors and logo for invoices and payment links
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Brand Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value, logo: null })}
                    required
                  >
                    <option value="">Select organization...</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                    {formData.logoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={formData.logoPreview}
                          alt="Logo preview"
                          className="max-h-24 mx-auto object-contain"
                        />
                        <div className="flex gap-2 justify-center">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleLogoChange}
                            className="hidden"
                            id="logo-change"
                          />
                          <label
                            htmlFor="logo-change"
                            className="cursor-pointer px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            Change
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logo: null, logoPreview: '', existingLogo: '' })}
                            className="px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleLogoChange}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer text-sm font-medium hover:underline"
                        >
                          Click to upload logo
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 500KB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Presets
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`p-2 rounded-lg border text-left transition-all hover:border-foreground/30 ${
                          formData.primaryColor === preset.primary 
                            ? 'border-foreground ring-1 ring-foreground' 
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span className="text-xs font-medium truncate">{preset.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Custom Colors</label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Primary / Button Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Button Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.buttonTextColor}
                        onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                        className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={formData.buttonTextColor}
                        onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={saving || !formData.organizationId} 
                    className="w-full gap-2"
                  >
                    {saving ? (
                      'Saving...'
                    ) : saved ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      'Save Branding Settings'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Invoice / Payment Link Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-xl overflow-hidden"
                style={{ backgroundColor: formData.backgroundColor }}
              >
                {/* Header with logo */}
                <div className="p-6 text-center border-b" style={{ borderColor: `${formData.primaryColor}20` }}>
                  {formData.logoPreview ? (
                    <img
                      src={formData.logoPreview}
                      alt="Logo"
                      className="max-h-12 mx-auto mb-4 object-contain"
                    />
                  ) : (
                    <div 
                      className="text-xl font-bold mb-2"
                      style={{ color: formData.primaryColor }}
                    >
                      {selectedOrg?.name || 'Your Company'}
                    </div>
                  )}
                  <h2 className="text-lg font-semibold">Invoice #INV-2024-0001</h2>
                  <p className="text-sm text-muted-foreground">Due: January 15, 2025</p>
                </div>

                {/* Invoice Details */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-sm">Consulting Services</span>
                      <span className="text-sm font-medium">$500.00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-sm">Project Management</span>
                      <span className="text-sm font-medium">$250.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold">Total Due</span>
                    <span className="text-2xl font-bold" style={{ color: formData.primaryColor }}>
                      $750.00
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: formData.primaryColor,
                      color: formData.buttonTextColor,
                    }}
                  >
                    Pay Now
                  </button>

                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Powered by LunarPay
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These branding settings will apply to:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Public invoice pages</li>
                <li>Payment link pages</li>
                <li>Invoice PDF documents</li>
                <li>Email notifications</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

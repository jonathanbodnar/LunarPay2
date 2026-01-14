'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Mail, 
  Save, 
  RotateCcw, 
  ChevronRight,
  Check,
  FileText,
  CreditCard,
  Bell,
  RefreshCcw,
  XCircle,
  AlertTriangle,
  KeyRound,
  Eye
} from 'lucide-react';

interface EmailTemplate {
  templateType: string;
  name: string;
  description: string;
  subject: string;
  heading: string;
  bodyText: string;
  buttonText: string;
  footerText: string;
  isActive: boolean;
  isCustomized: boolean;
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  portal_login: <KeyRound className="h-5 w-5" />,
  invoice: <FileText className="h-5 w-5" />,
  payment_confirmation: <CreditCard className="h-5 w-5" />,
  payment_notification: <Bell className="h-5 w-5" />,
  subscription_confirmation: <RefreshCcw className="h-5 w-5" />,
  subscription_cancelled: <XCircle className="h-5 w-5" />,
  payment_failed: <AlertTriangle className="h-5 w-5" />,
};

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  portal_login: ['{{organization}}', '{{code}}', '{{customer_name}}'],
  invoice: ['{{organization}}', '{{customer_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}'],
  payment_confirmation: ['{{organization}}', '{{customer_name}}', '{{amount}}', '{{date}}', '{{payment_method}}'],
  payment_notification: ['{{organization}}', '{{customer_name}}', '{{customer_email}}', '{{amount}}', '{{net_amount}}', '{{fee}}'],
  subscription_confirmation: ['{{organization}}', '{{customer_name}}', '{{amount}}', '{{frequency}}', '{{next_payment_date}}'],
  subscription_cancelled: ['{{organization}}', '{{customer_name}}'],
  payment_failed: ['{{organization}}', '{{customer_name}}', '{{amount}}', '{{reason}}'],
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [organization, setOrganization] = useState<{ id: number; name: string; primaryColor: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    heading: '',
    bodyText: '',
    buttonText: '',
    footerText: '',
    isActive: true,
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  useEffect(() => {
    if (organization) {
      fetchTemplates();
    }
  }, [organization]);

  useEffect(() => {
    if (selectedTemplate) {
      setFormData({
        subject: selectedTemplate.subject,
        heading: selectedTemplate.heading,
        bodyText: selectedTemplate.bodyText,
        buttonText: selectedTemplate.buttonText,
        footerText: selectedTemplate.footerText,
        isActive: selectedTemplate.isActive,
      });
    }
  }, [selectedTemplate]);

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organizations');
      if (!res.ok) throw new Error('Failed to fetch organization');
      const data = await res.json();
      const orgs = data.organizations || [];
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!organization) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/organizations/${organization.id}/email-templates`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch templates (${res.status})`);
      }
      const data = await res.json();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization || !selectedTemplate) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/organizations/${organization.id}/email-templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate.templateType,
          ...formData,
        }),
      });

      if (!res.ok) throw new Error('Failed to save template');

      // Update local state
      setTemplates(templates.map(t => 
        t.templateType === selectedTemplate.templateType 
          ? { ...t, ...formData, isCustomized: true }
          : t
      ));
      setSelectedTemplate({ ...selectedTemplate, ...formData, isCustomized: true });
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!organization || !selectedTemplate) return;
    
    if (!confirm('Reset this template to defaults? Your customizations will be lost.')) return;

    try {
      setResetting(true);
      const res = await fetch(
        `/api/organizations/${organization.id}/email-templates?templateType=${selectedTemplate.templateType}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to reset template');

      // Refresh templates
      await fetchTemplates();
    } catch (error) {
      console.error('Error resetting template:', error);
      alert('Failed to reset template');
    } finally {
      setResetting(false);
    }
  };

  const renderPreview = () => {
    const brandColor = organization?.primaryColor || '#000000';
    
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="text-center py-6 border-b">
            <div className="text-xl font-bold" style={{ color: brandColor }}>
              {organization?.name || 'Your Organization'}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: brandColor }}>
              {formData.heading || 'Email Heading'}
            </h2>
            
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">
              {formData.bodyText || 'Your email body text will appear here.'}
            </p>
            
            {formData.buttonText && (
              <div className="text-center my-6">
                <span 
                  className="inline-block px-6 py-3 text-white rounded-md font-medium"
                  style={{ backgroundColor: brandColor }}
                >
                  {formData.buttonText}
                </span>
              </div>
            )}
            
            {formData.footerText && (
              <p className="text-sm text-gray-500 mt-4 italic">
                {formData.footerText}
              </p>
            )}
          </div>
          
          {/* Footer */}
          <div className="text-center py-4 border-t bg-gray-50">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} LunarPay. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-gray-500 mt-1">Customize the emails sent to your customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {templates.map((template) => (
                <button
                  key={template.templateType}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedTemplate?.templateType === template.templateType 
                      ? 'bg-gray-50 border-l-4 border-black' 
                      : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedTemplate?.templateType === template.templateType 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {TEMPLATE_ICONS[template.templateType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {template.name}
                      {template.isCustomized && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {template.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-2">
          {selectedTemplate ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {TEMPLATE_ICONS[selectedTemplate.templateType]}
                      {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? 'Edit' : 'Preview'}
                    </Button>
                    {selectedTemplate.isCustomized && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={resetting}
                      >
                        {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        <span className="ml-2">Reset</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span className="ml-2">Save</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showPreview ? (
                  renderPreview()
                ) : (
                  <div className="space-y-6">
                    {/* Available Variables */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">Available Variables</div>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATE_VARIABLES[selectedTemplate.templateType]?.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => navigator.clipboard.writeText(variable)}
                            className="text-xs px-2 py-1 bg-white border rounded-md hover:bg-gray-100 font-mono transition-colors"
                            title="Click to copy"
                          >
                            {variable}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click a variable to copy it, then paste into your template.
                      </p>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Enter email subject..."
                        className="mt-1"
                      />
                    </div>

                    {/* Heading */}
                    <div>
                      <Label htmlFor="heading">Email Heading</Label>
                      <Input
                        id="heading"
                        value={formData.heading}
                        onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                        placeholder="Main heading in the email..."
                        className="mt-1"
                      />
                    </div>

                    {/* Body Text */}
                    <div>
                      <Label htmlFor="bodyText">Body Text</Label>
                      <textarea
                        id="bodyText"
                        value={formData.bodyText}
                        onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                        placeholder="Main content of the email..."
                        className="mt-1 w-full h-32 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Button Text (conditional) */}
                    {['invoice', 'payment_notification', 'payment_failed'].includes(selectedTemplate.templateType) && (
                      <div>
                        <Label htmlFor="buttonText">Button Text</Label>
                        <Input
                          id="buttonText"
                          value={formData.buttonText}
                          onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                          placeholder="e.g., View Invoice, Pay Now..."
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Footer Text */}
                    <div>
                      <Label htmlFor="footerText">Footer Text (optional)</Label>
                      <Input
                        id="footerText"
                        value={formData.footerText}
                        onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                        placeholder="Additional note or disclaimer..."
                        className="mt-1"
                      />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Enable this email</div>
                        <div className="text-sm text-gray-500">
                          When disabled, this email type will not be sent
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            formData.isActive ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an email type to customize</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}


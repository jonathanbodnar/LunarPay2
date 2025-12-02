'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function StatementsPage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleGenerateStatement = async () => {
    if (!formData.customerId || !formData.dateFrom || !formData.dateTo) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/statements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        // Download PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statement-${formData.customerId}-${formData.dateFrom}-to-${formData.dateTo}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate statement');
      }
    } catch (error) {
      alert('Error generating statement');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailStatement = async () => {
    if (!formData.customerId || !formData.dateFrom || !formData.dateTo) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/statements/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Statement sent successfully');
      } else {
        alert('Failed to send statement');
      }
    } catch (error) {
      alert('Error sending statement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Statements</h1>
        <p className="mt-2 text-gray-600">
          Generate transaction statements for customers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer *</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-gray-300"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select customer...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date *</label>
              <Input
                type="date"
                value={formData.dateFrom}
                onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date *</label>
              <Input
                type="date"
                value={formData.dateTo}
                onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleGenerateStatement}
              disabled={loading || !formData.customerId}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={handleEmailStatement}
              disabled={loading || !formData.customerId}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Email to Customer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Generate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
              setFormData({
                ...formData,
                dateFrom: firstDay.toISOString().split('T')[0],
                dateTo: now.toISOString().split('T')[0],
              });
            }}
          >
            This Month
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), 0, 1);
              setFormData({
                ...formData,
                dateFrom: firstDay.toISOString().split('T')[0],
                dateTo: now.toISOString().split('T')[0],
              });
            }}
          >
            Year to Date
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const now = new Date();
              const lastYear = new Date(now.getFullYear() - 1, 0, 1);
              const endLastYear = new Date(now.getFullYear() - 1, 11, 31);
              setFormData({
                ...formData,
                dateFrom: lastYear.toISOString().split('T')[0],
                dateTo: endLastYear.toISOString().split('T')[0],
              });
            }}
          >
            Last Year
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}



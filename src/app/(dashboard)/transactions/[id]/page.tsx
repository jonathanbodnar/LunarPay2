'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Download, RefreshCw, CreditCard, Building2, User, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, XCircle, Undo2, Loader2, X } from 'lucide-react';

interface Transaction {
  id: string;
  totalAmount: number;
  subTotalAmount: number;
  fee: number;
  status: string;
  source: string;
  bankType: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  zip: string | null;
  givingSource: string;
  template: string | null;
  isFeeCovered: boolean;
  fortisTransactionId: string | null;
  requestResponse: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  donor: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    amountAcum: number;
    feeAcum: number;
    netAcum: number;
    firstDate: string | null;
  };
  organization: {
    id: number;
    name: string;
    legalName: string | null;
    email: string | null;
    phoneNumber: string | null;
  };
  invoice: {
    id: number;
    status: string;
    totalAmount: number;
    paidAmount: number;
    hash: string;
    reference: string | null;
    memo: string | null;
  } | null;
  transactionFunds: Array<{
    id: number;
    amount: number;
    fee: number;
    net: number;
    fund: {
      id: number;
      name: string;
      description: string | null;
    };
  }>;
  refundTransaction: Transaction | null;
  originalTransaction: Transaction | null;
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params?.id as string;
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const canRefund = transaction && 
    (transaction.status === 'P' || transaction.status === 'succeeded') && 
    !transaction.refundTransaction;

  const handleRefund = async () => {
    if (!transaction) return;
    
    setRefundProcessing(true);
    setRefundError(null);

    try {
      const body: { amount?: number } = {};
      if (refundType === 'partial' && refundAmount) {
        body.amount = parseFloat(refundAmount);
      }

      const response = await fetch(`/api/transactions/${transaction.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setRefundError(data.error || 'Failed to process refund');
        return;
      }

      // Success - refresh transaction
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundType('full');
      fetchTransaction();
    } catch (error) {
      setRefundError('An error occurred while processing the refund');
    } finally {
      setRefundProcessing(false);
    }
  };

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransaction(data.transaction);
      } else if (response.status === 404) {
        router.push('/transactions');
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      'P': { label: 'Succeeded', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'N': { label: 'Failed', className: 'bg-red-100 text-red-800', icon: XCircle },
      'R': { label: 'Refunded', className: 'bg-gray-100 text-gray-800', icon: RefreshCw },
    };

    const statusInfo = statusMap[status] || { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
    const Icon = statusInfo.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusInfo.className}`}>
        <Icon className="h-4 w-4" />
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Transaction not found</p>
          <Button onClick={() => router.push('/transactions')} className="mt-4">
            Back to Transactions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/transactions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
            <p className="mt-2 text-gray-600">View complete transaction information</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canRefund && (
            <Button 
              variant="outline" 
              onClick={() => {
                setRefundAmount(String(Number(transaction.totalAmount)));
                setShowRefundModal(true);
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Refund
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && transaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Refund Transaction</h2>
              <button onClick={() => setShowRefundModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Original Amount</span>
                  <span className="font-semibold">{formatCurrency(Number(transaction.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-medium">{transaction.firstName} {transaction.lastName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Refund Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundType === 'full'}
                      onChange={() => {
                        setRefundType('full');
                        setRefundAmount(String(Number(transaction.totalAmount)));
                      }}
                      className="w-4 h-4"
                    />
                    <span>Full Refund</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundType === 'partial'}
                      onChange={() => setRefundType('partial')}
                      className="w-4 h-4"
                    />
                    <span>Partial Refund</span>
                  </label>
                </div>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Refund Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={Number(transaction.totalAmount)}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Max: {formatCurrency(Number(transaction.totalAmount))}
                  </p>
                </div>
              )}

              {refundError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {refundError}
                </div>
              )}

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This action cannot be undone. The refund will be processed through the payment processor.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowRefundModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={refundProcessing || (refundType === 'partial' && (!refundAmount || parseFloat(refundAmount) <= 0))}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {refundProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Refund {refundType === 'full' ? formatCurrency(Number(transaction.totalAmount)) : formatCurrency(parseFloat(refundAmount) || 0)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transaction Information</span>
                {getStatusBadge(transaction.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-sm">{transaction.id}</p>
                </div>
                {transaction.fortisTransactionId && (
                  <div>
                    <p className="text-sm text-gray-500">Processor ID</p>
                    <p className="font-mono text-sm">{transaction.fortisTransactionId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(transaction.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium flex items-center gap-2">
                    {transaction.source === 'CC' ? (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Credit Card
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4" />
                        ACH / Bank Transfer
                        {transaction.bankType && ` (${transaction.bankType})`}
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium">{transaction.givingSource}</p>
                </div>
                {transaction.template && (
                  <div>
                    <p className="text-sm text-gray-500">Template</p>
                    <p className="font-medium">{transaction.template}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Amount Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(Number(transaction.subTotalAmount))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-medium">{formatCurrency(Number(transaction.fee))}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(Number(transaction.totalAmount))}
                </span>
              </div>
              {transaction.isFeeCovered && (
                <p className="text-sm text-gray-500 mt-2">
                  * Fee covered by customer
                </p>
              )}
            </CardContent>
          </Card>

          {transaction.transactionFunds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fund Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transaction.transactionFunds.map((tf) => (
                    <div key={tf.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{tf.fund.name}</p>
                        {tf.fund.description && (
                          <p className="text-sm text-gray-500">{tf.fund.description}</p>
                        )}
                      </div>
                      <p className="font-medium">{formatCurrency(Number(tf.amount))}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {transaction.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Related Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice #</span>
                    <span className="font-medium">{transaction.invoice.reference || transaction.invoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium capitalize">{transaction.invoice.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">{formatCurrency(Number(transaction.invoice.totalAmount))}</span>
                  </div>
                  {transaction.invoice.memo && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-1">Memo</p>
                      <p className="text-sm">{transaction.invoice.memo}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => router.push(`/invoices/${transaction.invoice?.id}`)}
                  >
                    View Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {transaction.refundTransaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <RefreshCw className="h-5 w-5" />
                  Refund Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund ID</span>
                    <span className="font-mono text-sm">{transaction.refundTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Amount</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(Math.abs(Number(transaction.refundTransaction.totalAmount)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Date</span>
                    <span className="font-medium">{formatDate(transaction.refundTransaction.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {transaction.originalTransaction && (
            <Card>
              <CardHeader>
                <CardTitle>Original Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/transactions/${transaction.originalTransaction?.id}`)}
                >
                  View Original Transaction
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">
                  {transaction.donor.firstName} {transaction.donor.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{transaction.donor.email}</p>
              </div>
              {transaction.donor.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{transaction.donor.phone}</p>
                </div>
              )}
              {(transaction.donor.address || transaction.donor.city) && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {[
                      transaction.donor.address,
                      transaction.donor.city,
                      transaction.donor.state,
                      transaction.donor.zip,
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500 mb-2">Customer Totals</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Given</span>
                    <span className="font-medium">{formatCurrency(Number(transaction.donor.amountAcum))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fees</span>
                    <span className="font-medium">{formatCurrency(Number(transaction.donor.feeAcum))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Amount</span>
                    <span className="font-medium">{formatCurrency(Number(transaction.donor.netAcum))}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/customers/${transaction.donor.id}`)}
              >
                View Customer Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{transaction.organization.name}</p>
              {transaction.organization.legalName && (
                <p className="text-sm text-gray-500 mt-1">{transaction.organization.legalName}</p>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/organizations/${transaction.organization.id}`)}
              >
                View Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


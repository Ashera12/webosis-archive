'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Shield,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ReEnrollmentRequest {
  userId: string;
  userName: string;
  userEmail: string;
  userClass: string;
  userRole: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  requestedAt: string;
  enrolledAt: string;
}

export default function ReEnrollmentRequestsPage() {
  const [requests, setRequests] = useState<ReEnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/re-enrollment-requests');
      
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await res.json();
      setRequests(data.requests || []);
      setStats({
        total: data.total || 0,
        pending: data.pending || 0,
        approved: data.approved || 0,
        rejected: data.rejected || 0,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Gagal memuat data request re-enrollment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId: string, userName: string) => {
    if (!confirm(`Approve re-enrollment request dari ${userName}?`)) {
      return;
    }

    try {
      setProcessing(userId);
      const res = await fetch('/api/admin/re-enrollment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'approve',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to approve request');
      }

      toast.success(`✅ Request dari ${userName} berhasil di-approve!`);
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Gagal approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    if (!confirm(`Reject re-enrollment request dari ${userName}?`)) {
      return;
    }

    try {
      setProcessing(userId);
      const res = await fetch('/api/admin/re-enrollment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'reject',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to reject request');
      }

      toast.success(`❌ Request dari ${userName} berhasil di-reject`);
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Gagal reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Re-enrollment Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage biometric re-enrollment approval requests
          </p>
        </div>
        <Button onClick={fetchRequests} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-700 dark:text-yellow-400">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-300 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-700 dark:text-green-400">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-700 dark:text-red-400">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Loading requests...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.userId} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <CardTitle className="text-lg">{request.userName}</CardTitle>
                            {getStatusBadge(request.status)}
                          </div>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Email:</span>
                              <span>{request.userEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Kelas:</span>
                              <span>{request.userClass || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-3 h-3" />
                              <span className="font-medium">Requested:</span>
                              <span>{formatDate(request.requestedAt)}</span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(request.userId, request.userName)}
                            disabled={processing === request.userId}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(request.userId, request.userName)}
                            disabled={processing === request.userId}
                            size="sm"
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Alasan Request:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.reason}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Pending Requests */}
          {pendingRequests.length === 0 && (
            <Card className="mb-8">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Tidak ada pending requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Semua request re-enrollment sudah diproses
                </p>
              </CardContent>
            </Card>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Processed Requests ({processedRequests.length})
              </h2>
              <div className="space-y-4">
                {processedRequests.map((request) => (
                  <Card key={request.userId} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <CardTitle className="text-lg">{request.userName}</CardTitle>
                            {getStatusBadge(request.status)}
                          </div>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Email:</span>
                              <span>{request.userEmail}</span>
                            </div>
                            {request.approvedBy && (
                              <div className="flex items-center gap-2 text-sm">
                                <Shield className="w-3 h-3" />
                                <span className="font-medium">Processed by:</span>
                                <span>{request.approvedBy}</span>
                                {request.approvedAt && (
                                  <span className="text-gray-500">
                                    • {formatDate(request.approvedAt)}
                                  </span>
                                )}
                              </div>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Alasan:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.reason}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

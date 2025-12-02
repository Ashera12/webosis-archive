'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface BiometricData {
  user_id: string;
  reference_photo_url: string;
  webauthn_credential_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BiometricManagementProps {
  biometricData: BiometricData | null;
  onResetRequest: () => void;
  onReEnroll: () => void;
}

export default function BiometricManagement({
  biometricData,
  onResetRequest,
  onReEnroll
}: BiometricManagementProps) {
  const [showConfirm, setShowConfirm] = useState<'reset' | 're-enroll' | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const handleResetRequest = async () => {
    setRequestLoading(true);
    
    try {
      toast.loading('Sending reset request to admin...', { id: 'reset-request' });

      const response = await fetch('/api/attendance/biometric/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'User requested biometric data reset'
        })
      });

      const data = await response.json();
      toast.dismiss('reset-request');

      if (data.success) {
        toast.success(
          <div>
            <div className="font-bold">✅ Request Sent!</div>
            <div className="text-sm mt-1">Admin will review your reset request</div>
          </div>,
          { duration: 5000 }
        );
        setShowConfirm(null);
        onResetRequest();
      } else {
        throw new Error(data.error || 'Failed to send request');
      }
    } catch (error: any) {
      toast.dismiss('reset-request');
      toast.error(
        <div>
          <div className="font-bold">❌ Request Failed</div>
          <div className="text-sm mt-1">{error.message}</div>
        </div>
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const handleReEnroll = () => {
    setShowConfirm(null);
    onReEnroll();
  };

  if (!biometricData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-800">Biometric Not Setup</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You haven't set up biometric authentication yet. Please complete the initial setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🔐</div>
          <div className="flex-1">
            <h3 className="font-bold">Biometric Authentication Status</h3>
            <p className="text-sm text-gray-600">Manage your biometric data</p>
          </div>
          <div className="text-green-600 font-bold">✓ Active</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Setup Date</div>
            <div className="font-medium">{new Date(biometricData.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-gray-500">Last Updated</div>
            <div className="font-medium">{new Date(biometricData.updated_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-gray-500">Authentication Method</div>
            <div className="font-medium">
              {biometricData.webauthn_credential_id ? '🔐 WebAuthn + AI' : '🤖 AI Only'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Photo Reference</div>
            <div className="font-medium text-green-600">✓ Stored</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold mb-3">Management Options</h4>
        <div className="space-y-2">
          {/* Re-enroll */}
          <button
            onClick={() => setShowConfirm('re-enroll')}
            className="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔄</div>
              <div className="flex-1">
                <div className="font-medium">Re-enroll Biometric</div>
                <div className="text-sm text-gray-600">Update your photo and fingerprint data</div>
              </div>
              <div className="text-blue-600">→</div>
            </div>
          </button>

          {/* Reset Request */}
          <button
            onClick={() => setShowConfirm('reset')}
            className="w-full text-left p-3 bg-white border border-red-200 rounded-lg hover:border-red-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🗑️</div>
              <div className="flex-1">
                <div className="font-medium">Request Data Reset</div>
                <div className="text-sm text-gray-600">Ask admin to delete your biometric data</div>
              </div>
              <div className="text-red-600">→</div>
            </div>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className={`p-6 rounded-t-2xl ${showConfirm === 'reset' ? 'bg-red-50' : 'bg-blue-50'}`}>
              <div className="text-4xl mb-2">{showConfirm === 'reset' ? '🗑️' : '🔄'}</div>
              <h3 className="text-xl font-bold">
                {showConfirm === 'reset' ? 'Request Data Reset?' : 'Re-enroll Biometric?'}
              </h3>
            </div>

            <div className="p-6">
              {showConfirm === 'reset' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    This will send a request to the admin to <strong>delete all your biometric data</strong>. 
                    After approval:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Your photo reference will be deleted</li>
                    <li>Your fingerprint template will be removed</li>
                    <li>WebAuthn credentials will be cleared</li>
                    <li>You'll need to re-enroll to use biometric attendance</li>
                  </ul>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ This action requires admin approval and cannot be undone automatically.
                    </p>
                  </div>
                </div>
              )}

              {showConfirm === 're-enroll' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    You will update your biometric data by taking a new photo and re-scanning your fingerprint.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Take a new selfie photo</li>
                    <li>Re-scan your fingerprint</li>
                    <li>Update authentication method</li>
                    <li>Old data will be replaced</li>
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-800 font-medium">
                      💡 Useful if your appearance changed or you want to update your biometric method.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex gap-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={requestLoading}
              >
                Cancel
              </button>
              <button
                onClick={showConfirm === 'reset' ? handleResetRequest : handleReEnroll}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  showConfirm === 'reset'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:bg-gray-300`}
                disabled={requestLoading}
              >
                {requestLoading ? 'Processing...' : showConfirm === 'reset' ? 'Send Request' : 'Re-enroll Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { detectBiometricMethods, BiometricMethod } from '@/lib/biometric-methods';

interface BiometricSetupWizardProps {
  userId: string;
  userEmail: string;
  userName: string;
  photoBlob: Blob;
  fingerprintHash: string;
  onComplete: (credentialId: string | null, biometricType: string, deviceInfo?: any) => void;
  onCancel: () => void;
}

// Helper functions for device detection
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

export default function BiometricSetupWizard({
  userId,
  userEmail,
  userName,
  photoBlob,
  fingerprintHash,
  onComplete,
  onCancel
}: BiometricSetupWizardProps) {
  const [step, setStep] = useState<'select' | 'setup' | 'verify'>('select');
  const [availableMethods, setAvailableMethods] = useState<BiometricMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<BiometricMethod | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableMethods();
  }, []);

  const loadAvailableMethods = async () => {
    try {
      const methods = await detectBiometricMethods();
      console.log('[Wizard] Available methods:', methods);
      setAvailableMethods(methods);

      // Auto-select primary method
      const primary = methods.find(m => m.primary && m.available);
      if (primary) {
        setSelectedMethod(primary);
      }
    } catch (error) {
      console.error('[Wizard] Failed to detect methods:', error);
      toast.error('Gagal mendeteksi metode biometric');
    }
  };

  const handleMethodSelect = (method: BiometricMethod) => {
    setSelectedMethod(method);
    console.log('[Wizard] Selected method:', method.id);
  };

  const handleSetup = async () => {
    if (!selectedMethod) {
      toast.error('Pilih metode biometric terlebih dahulu');
      return;
    }

    setLoading(true);
    setStep('setup');

    try {
      toast.loading(
        <div>
          <div className="font-bold">🔐 Setting up {selectedMethod.name}</div>
          <div className="text-sm mt-1">{selectedMethod.description}</div>
        </div>,
        { id: 'biometric-setup' }
      );

      // Simulate WebAuthn registration based on method
      let credentialId: string | null = null;

      if (selectedMethod.id !== 'pin-code') {
        // WebAuthn registration
        try {
          const publicKeyOptions: PublicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(32),
            rp: {
              name: 'Webosis Attendance',
              id: window.location.hostname
            },
            user: {
              id: new TextEncoder().encode(userId),
              name: userEmail,
              displayName: userName
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },  // ES256
              { alg: -257, type: 'public-key' } // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              residentKey: 'preferred'
            },
            timeout: 60000
          };

          const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
          }) as PublicKeyCredential;

          if (credential) {
            credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            console.log('[Wizard] ✅ Credential registered:', credentialId.substring(0, 20));
          }
        } catch (webauthnError: any) {
          console.warn('[Wizard] WebAuthn failed, using AI-only mode:', webauthnError);
          toast.dismiss('biometric-setup');
          toast(
            <div>
              <div className="font-bold">⚠️ Using AI-Only Mode</div>
              <div className="text-sm mt-1">Browser biometric setup failed, will use photo verification only</div>
            </div>,
            { duration: 5000, icon: '⚠️' }
          );
        }
      }

      // Success
      setStep('verify');
      toast.dismiss('biometric-setup');
      toast.success(
        <div>
          <div className="font-bold">✅ {selectedMethod.name} Ready!</div>
          <div className="text-sm mt-1">Setup complete, verifying...</div>
        </div>
      );

      // Complete setup with device info
      setTimeout(() => {
        // ✅ Collect device info
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          browser: getBrowserName(),
          deviceType: getDeviceType()
        };
        
        onComplete(credentialId, selectedMethod.id, deviceInfo);
      }, 1500);

    } catch (error: any) {
      console.error('[Wizard] Setup error:', error);
      toast.dismiss('biometric-setup');
      toast.error(
        <div>
          <div className="font-bold">❌ Setup Failed</div>
          <div className="text-sm mt-1">{error.message}</div>
        </div>
      );
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">🔐 Setup Biometric Authentication</h2>
          <p className="text-blue-100 mt-2">
            {step === 'select' && 'Pilih metode autentikasi biometric'}
            {step === 'setup' && 'Mengatur biometric authentication...'}
            {step === 'verify' && 'Memverifikasi setup...'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center ${step === 'select' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Select</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-200 mx-2" />
            
            <div className={`flex items-center ${step === 'setup' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'setup' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Setup</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-200 mx-2" />
            
            <div className={`flex items-center ${step === 'verify' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'verify' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Verify</span>
            </div>
          </div>

          {/* Step 1: Select Method */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  📱 Pilih metode biometric yang tersedia di perangkat Anda. 
                  Kami merekomendasikan metode yang ditandai dengan ⭐ <strong>RECOMMENDED</strong>.
                </p>
              </div>

              {availableMethods.length === 0 && (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl mb-4">⚙️</div>
                  <p className="text-gray-600">Detecting biometric methods...</p>
                </div>
              )}

              {availableMethods.filter(m => m.available).map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedMethod?.id === method.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="text-4xl mr-4">{method.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{method.name}</h3>
                        {method.primary && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            ⭐ RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    </div>
                    {selectedMethod?.id === method.id && (
                      <div className="text-blue-600 text-2xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Setup */}
          {step === 'setup' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 animate-pulse">{selectedMethod?.icon}</div>
              <h3 className="text-xl font-bold mb-2">Setting up {selectedMethod?.name}</h3>
              <p className="text-gray-600 mb-4">{selectedMethod?.description}</p>
              <div className="animate-spin text-4xl mb-4">⚙️</div>
              <p className="text-sm text-gray-500">Please authenticate when prompted...</p>
            </div>
          )}

          {/* Step 3: Verify */}
          {step === 'verify' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">Verification Complete!</h3>
              <p className="text-gray-600">Your {selectedMethod?.name} is ready to use</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-2xl flex gap-3">
          {step === 'select' && (
            <>
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSetup}
                disabled={!selectedMethod || loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {selectedMethod ? `Setup ${selectedMethod.name}` : 'Select a method'}
              </button>
            </>
          )}

          {(step === 'setup' || step === 'verify') && (
            <div className="flex-1 text-center text-gray-500">
              Please wait...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

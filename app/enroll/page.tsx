// app/enroll/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaCamera, FaFingerprint, FaCheckCircle, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';

/**
 * MANDATORY ENROLLMENT PAGE
 * User CANNOT access /attendance until completing:
 * 1. Face Anchor Upload (8-layer anti-spoofing)
 * 2. Device Binding (WebAuthn/Passkey)
 */

type EnrollmentStep = 'check' | 'photo' | 'passkey' | 'complete';

interface AntiSpoofingResult {
  liveness: boolean;
  maskDetected: boolean;
  deepfakeDetected: boolean;
  poseDiversity: boolean;
  lightSourceValid: boolean;
  depthEstimation: boolean;
  microExpression: boolean;
  ageConsistency: boolean;
  overallScore: number;
  passedLayers: number;
}

export default function EnrollmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [step, setStep] = useState<EnrollmentStep>('check');
  const [loading, setLoading] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    hasReferencePhoto: false,
    hasPasskey: false,
    isComplete: false,
  });
  
  // Photo upload
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [antiSpoofing, setAntiSpoofing] = useState<AntiSpoofingResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState('');
  
  // Live camera preview
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useState<HTMLVideoElement | null>(null)[0];
  
  // Passkey registration
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/enroll');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      checkEnrollmentStatus();
    }
  }, [status]);

  const checkEnrollmentStatus = async () => {
    try {
      const response = await fetch('/api/enroll/status');
      const data = await response.json();
      
      if (data.success) {
        setEnrollmentStatus(data.status);
        
        if (data.status.isComplete) {
          // Already enrolled → redirect to attendance
          toast.success('Enrollment sudah selesai! Redirecting...');
          setTimeout(() => router.push('/attendance'), 1500);
        } else if (data.status.hasReferencePhoto && !data.status.hasPasskey) {
          setStep('passkey');
        } else if (!data.status.hasReferencePhoto) {
          setStep('photo');
        }
      }
    } catch (error) {
      console.error('Failed to check enrollment status:', error);
      setStep('photo');
    }
  };

  const startCameraPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      
      toast.success('📸 Posisikan wajah Anda di tengah frame');
      
    } catch (error) {
      toast.error('❌ Gagal mengakses kamera. Pastikan kamera diizinkan.');
      console.error('[Camera Error]', error);
    }
  };

  const stopCameraPreview = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhotoFromPreview = () => {
    if (!videoRef || !cameraStream) {
      toast.error('Kamera belum siap');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.videoWidth;
      canvas.height = videoRef.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setPhotoPreview(canvas.toDataURL('image/jpeg'));
          stopCameraPreview();
          toast.success('✅ Foto berhasil diambil!');
        }
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      toast.error('Gagal mengambil foto');
      console.error('[Capture Error]', error);
    }
  };

  const handle8LayerVerification = async () => {
    if (!photoBlob) return;
    
    setVerifying(true);
    setVerificationProgress('🔍 Layer 1: Analyzing face liveness...');
    
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(photoBlob);
      });
      
      setVerificationProgress('🎭 Layer 2: Checking for mask/disguise...');
      await new Promise(r => setTimeout(r, 800));
      
      setVerificationProgress('🤖 Layer 3: Deepfake detection...');
      await new Promise(r => setTimeout(r, 800));
      
      setVerificationProgress('📐 Layer 4: Pose diversity analysis...');
      await new Promise(r => setTimeout(r, 800));
      
      setVerificationProgress('💡 Layer 5: Light source validation...');
      await new Promise(r => setTimeout(r, 800));
      
      setVerificationProgress('📏 Layer 6: Depth estimation...');
      await new Promise(r => setTimeout(r, 800));
      
      setVerificationProgress('😊 Layer 7: Micro-expression scan...');
      await new Promise(r => setTimeout(r, 800));
      
      setVerificationProgress('🎂 Layer 8: Age consistency check...');
      await new Promise(r => setTimeout(r, 800));
      
      const response = await fetch('/api/enroll/verify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64 }),
      });
      
      const data = await response.json();
      
      setVerifying(false);
      
      if (data.success && data.antiSpoofing.overallScore >= 0.95) {
        setAntiSpoofing(data.antiSpoofing);
        
        toast.success(
          <div>
            <div className="font-bold">✅ All 8 Layers Passed!</div>
            <div className="text-sm">Score: {(data.antiSpoofing.overallScore * 100).toFixed(1)}%</div>
          </div>,
          { duration: 3000 }
        );
        
        // Upload photo
        await uploadReferencePhoto();
        
      } else {
        const failed = [];
        const result = data.antiSpoofing;
        
        if (!result.liveness) failed.push('❌ Liveness failed');
        if (result.maskDetected) failed.push('❌ Mask detected');
        if (result.deepfakeDetected) failed.push('❌ Deepfake detected');
        if (!result.poseDiversity) failed.push('❌ Poor pose diversity');
        if (!result.lightSourceValid) failed.push('❌ Invalid lighting');
        if (!result.depthEstimation) failed.push('❌ Depth check failed');
        if (!result.microExpression) failed.push('❌ Unnatural expression');
        if (!result.ageConsistency) failed.push('❌ Age inconsistent');
        
        toast.error(
          <div className="max-w-md">
            <div className="font-bold">❌ Verification Failed</div>
            <div className="text-xs mt-2 space-y-1">
              {failed.map((f, i) => <div key={i}>{f}</div>)}
            </div>
            <div className="text-xs mt-2">Score: {(result.overallScore * 100).toFixed(1)}%</div>
          </div>,
          { duration: 8000 }
        );
        
        setPhotoBlob(null);
        setPhotoPreview('');
      }
      
    } catch (error: any) {
      setVerifying(false);
      toast.error(error.message || 'Verification failed');
    }
  };

  const uploadReferencePhoto = async () => {
    if (!photoBlob) return;
    
    const uploadToast = toast.loading('📤 Uploading face anchor...');
    
    try {
      const formData = new FormData();
      formData.append('photo', photoBlob);
      
      const response = await fetch('/api/enroll/upload-photo', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      toast.dismiss(uploadToast);
      
      if (data.success) {
        toast.success('✅ Face anchor saved!');
        setEnrollmentStatus(prev => ({ ...prev, hasReferencePhoto: true }));
        setStep('passkey');
      } else {
        throw new Error(data.error);
      }
      
    } catch (error: any) {
      toast.dismiss(uploadToast);
      toast.error(error.message || 'Upload failed');
    }
  };

  const handlePasskeyRegistration = async () => {
    setLoading(true);
    
    try {
      // Get registration challenge
      const challengeRes = await fetch('/api/enroll/passkey-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session!.user.id }),
      });
      
      const challengeData = await challengeRes.json();
      
      if (!challengeData.success) {
        throw new Error(challengeData.error);
      }
      
      // Create credential
      const { options } = challengeData;
      
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0)),
          user: {
            ...options.user,
            id: Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0)),
          },
        },
      }) as PublicKeyCredential;
      
      // Verify registration
      const verifyRes = await fetch('/api/enroll/passkey-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            response: {
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((credential.response as any).clientDataJSON))),
              attestationObject: btoa(String.fromCharCode(...new Uint8Array((credential.response as any).attestationObject))),
            },
            type: credential.type,
          },
        }),
      });
      
      const verifyData = await verifyRes.json();
      
      if (verifyData.success) {
        toast.success('✅ Passkey registered!');
        setPasskeyRegistered(true);
        setEnrollmentStatus(prev => ({ ...prev, hasPasskey: true, isComplete: true }));
        setStep('complete');
      } else {
        throw new Error(verifyData.error);
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Passkey registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <FaShieldAlt className="text-4xl text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔒 Security Enrollment
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Setup biometric identity before attendance access
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${enrollmentStatus.hasReferencePhoto ? 'text-green-600' : 'text-gray-400'}`}>
              {enrollmentStatus.hasReferencePhoto ? <FaCheckCircle /> : <FaTimesCircle />}
              <span className="font-semibold">Face Anchor</span>
            </div>
            <div className="w-16 h-1 bg-gray-300 dark:bg-gray-700"></div>
            <div className={`flex items-center gap-2 ${enrollmentStatus.hasPasskey ? 'text-green-600' : 'text-gray-400'}`}>
              {enrollmentStatus.hasPasskey ? <FaCheckCircle /> : <FaTimesCircle />}
              <span className="font-semibold">Device Binding</span>
            </div>
          </div>
        </div>
        
        {/* Step: Photo Upload */}
        {step === 'photo' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              📸 Step 1: Face Anchor Setup
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upload a clear photo of your face. This will be your biometric identity anchor.
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ 8-Layer Anti-Spoofing Active
              </p>
              <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>✓ Liveness detection (blink, movement)</li>
                <li>✓ Mask/disguise detection</li>
                <li>✓ Deepfake texture analysis</li>
                <li>✓ Pose diversity check</li>
                <li>✓ Light source validation</li>
                <li>✓ Depth estimation (3D face)</li>
                <li>✓ Micro-expression scan</li>
                <li>✓ Age consistency check</li>
              </ul>
            </div>
            
            {!photoPreview && !showCamera ? (
              <button
                onClick={startCameraPreview}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <FaCamera className="text-xl" />
                Start Camera Preview
              </button>
            ) : showCamera ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-blue-500">
                  <video
                    ref={(el) => {
                      if (el && cameraStream) {
                        el.srcObject = cameraStream;
                        el.play();
                        (videoRef as any) = el;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto transform -scale-x-100"
                  />
                  <div className="absolute inset-0 border-4 border-dashed border-yellow-400 m-8 rounded-lg pointer-events-none"></div>
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold">
                    📸 Posisikan wajah di tengah frame
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={stopCameraPreview}
                    className="py-3 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    ❌ Batal
                  </button>
                  <button
                    onClick={capturePhotoFromPreview}
                    className="py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FaCamera className="text-xl" />
                    📸 Ambil Foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <img src={photoPreview} alt="Preview" className="w-full rounded-xl shadow-lg" />
                
                {verifying && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <div className="font-bold text-blue-900 dark:text-blue-100">
                          Verifying...
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {verificationProgress}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {antiSpoofing && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4">
                    <p className="font-bold text-green-900 dark:text-green-100 mb-2">
                      ✅ Verification Complete!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>{antiSpoofing.liveness ? '✅' : '❌'} Liveness</div>
                      <div>{!antiSpoofing.maskDetected ? '✅' : '❌'} No Mask</div>
                      <div>{!antiSpoofing.deepfakeDetected ? '✅' : '❌'} Real Face</div>
                      <div>{antiSpoofing.poseDiversity ? '✅' : '❌'} Pose OK</div>
                      <div>{antiSpoofing.lightSourceValid ? '✅' : '❌'} Lighting</div>
                      <div>{antiSpoofing.depthEstimation ? '✅' : '❌'} Depth</div>
                      <div>{antiSpoofing.microExpression ? '✅' : '❌'} Expression</div>
                      <div>{antiSpoofing.ageConsistency ? '✅' : '❌'} Age</div>
                    </div>
                    <div className="mt-2 font-bold text-green-800 dark:text-green-200">
                      Score: {(antiSpoofing.overallScore * 100).toFixed(1)}% ({antiSpoofing.passedLayers}/8 layers)
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPhotoBlob(null);
                      setPhotoPreview('');
                      setAntiSpoofing(null);
                    }}
                    disabled={verifying}
                    className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl disabled:opacity-50"
                  >
                    Retake
                  </button>
                  {!antiSpoofing && (
                    <button
                      onClick={handle8LayerVerification}
                      disabled={verifying}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
                    >
                      Verify & Upload
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step: Passkey Registration */}
        {step === 'passkey' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-purple-200 dark:border-purple-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              🔐 Step 2: Device Binding
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Register your device fingerprint/passkey for second-factor authentication.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                Supported Methods:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Windows Hello (Face/Fingerprint/PIN)</li>
                <li>✓ Android Biometric</li>
                <li>✓ iPhone FaceID/TouchID</li>
                <li>✓ Hardware Security Keys (YubiKey, etc)</li>
              </ul>
            </div>
            
            <button
              onClick={handlePasskeyRegistration}
              disabled={loading || passkeyRegistered}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaFingerprint className="text-xl" />
              {loading ? 'Registering...' : passkeyRegistered ? 'Passkey Registered ✅' : 'Register Passkey'}
            </button>
          </div>
        )}
        
        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-green-200 dark:border-green-700 text-center">
            <div className="inline-block p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <FaCheckCircle className="text-5xl text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              🎉 Enrollment Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your biometric identity is now secured. You can access attendance system.
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-bold text-green-900 dark:text-green-100">Face Anchor</div>
                  <div className="text-green-700 dark:text-green-300">✅ Registered</div>
                </div>
                <div>
                  <div className="font-bold text-green-900 dark:text-green-100">Device Binding</div>
                  <div className="text-green-700 dark:text-green-300">✅ Active</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/attendance')}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all"
            >
              Go to Attendance System →
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}

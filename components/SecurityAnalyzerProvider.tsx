// components/SecurityAnalyzerProvider.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { backgroundSecurityAnalyzer, SecurityAnalysisResult } from '@/lib/backgroundSecurityAnalyzer';
import { toast } from 'react-hot-toast';

/**
 * SECURITY ANALYZER PROVIDER
 * Automatically runs security analysis after login
 * Provides instant feedback when user navigates to attendance page
 */
export function SecurityAnalyzerProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [analysisResult, setAnalysisResult] = useState<SecurityAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userId = (session.user as any).id;
      const userEmail = session.user.email || '';
      const userRole = ((session.user as any).role || '').toLowerCase();

      // Only analyze for siswa and guru
      if (!['siswa', 'guru'].includes(userRole)) {
        console.log('[Security Analyzer] Skipping - Role not applicable:', userRole);
        return;
      }

      console.log('[Security Analyzer] User authenticated, starting background analysis...');
      runBackgroundAnalysis(userId, userEmail);

      // Re-run analysis every 2 minutes to keep data fresh
      const interval = setInterval(() => {
        console.log('[Security Analyzer] Re-running analysis (scheduled)...');
        runBackgroundAnalysis(userId, userEmail, true);
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [status, session]);

  const runBackgroundAnalysis = async (
    userId: string,
    userEmail: string,
    silent = false
  ) => {
    try {
      if (!silent) setAnalyzing(true);

      const result = await backgroundSecurityAnalyzer.startAnalysis(userId, userEmail);
      setAnalysisResult(result);

      console.log('[Security Analyzer] Analysis complete:', {
        status: result.overallStatus,
        wifiValid: result.wifi.isValid,
        wifiSSID: result.wifi.ssid,
        biometricRegistered: result.biometric.registered,
        blockReasons: result.blockReasons,
      });

      // Show toast notification based on status (only on initial analysis)
      if (!silent) {
        showAnalysisNotification(result);
      }
    } catch (error) {
      console.error('[Security Analyzer] Analysis failed:', error);
    } finally {
      if (!silent) setAnalyzing(false);
    }
  };

  const showAnalysisNotification = (result: SecurityAnalysisResult) => {
    if (result.overallStatus === 'READY') {
      toast.success(
        <div>
          <div className="font-bold">✅ Siap Absen!</div>
          <div className="text-sm mt-1">
            WiFi: {result.wifi.ssid} • Biometric: Terdaftar
          </div>
        </div>,
        { duration: 3000, id: 'security-analysis' }
      );
    } else if (result.overallStatus === 'BLOCKED') {
      const reasons = result.blockReasons.map((r) => {
        switch (r) {
          case 'INVALID_WIFI':
            return 'WiFi tidak sesuai';
          case 'WIFI_NOT_DETECTED':
            return 'WiFi tidak terdeteksi';
          case 'BIOMETRIC_NOT_REGISTERED':
            return 'Biometric belum didaftarkan';
          default:
            return r;
        }
      });

      toast.error(
        <div>
          <div className="font-bold">❌ Tidak Bisa Absen</div>
          <div className="text-sm mt-1">{reasons.join(' • ')}</div>
          {result.wifi.validationError && (
            <div className="text-xs mt-1 opacity-80">{result.wifi.validationError}</div>
          )}
        </div>,
        { duration: 5000, id: 'security-analysis' }
      );
    } else if (result.overallStatus === 'NEEDS_SETUP') {
      toast(
        <div>
          <div className="font-bold">⚠️ Setup Diperlukan</div>
          <div className="text-sm mt-1">
            Biometric belum didaftarkan. Buka halaman Absensi untuk setup.
          </div>
        </div>,
        {
          duration: 4000,
          id: 'security-analysis',
          icon: '⚠️',
        }
      );
    }
  };

  // Expose analysis result to children via context if needed
  // For now, just run in background
  return <>{children}</>;
}

/**
 * Hook to get current security analysis result
 */
export function useSecurityAnalysis() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return {
      result: null,
      isReady: false,
      isBlocked: false,
      blockReasons: [],
    };
  }

  const result = backgroundSecurityAnalyzer.getCachedAnalysis(userId);

  return {
    result,
    isReady: result?.overallStatus === 'READY',
    isBlocked: result?.overallStatus === 'BLOCKED',
    blockReasons: result?.blockReasons || [],
  };
}

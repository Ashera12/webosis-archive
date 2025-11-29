// components/AIMonitorClient.tsx
'use client';

import { useEffect } from 'react';
import { initAIMonitoring } from '@/lib/ai-monitor';

/**
 * AI Monitor Client Component
 * Initializes AI monitoring in browser
 */
export default function AIMonitorClient() {
  useEffect(() => {
    // Initialize AI monitoring on mount
    initAIMonitoring();
    
    console.log('🤖 AI Monitoring System Active');
    
    // Cleanup on unmount
    return () => {
      console.log('🤖 AI Monitoring System Stopped');
    };
  }, []);

  return null; // This component renders nothing
}

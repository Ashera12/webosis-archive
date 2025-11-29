// app/api/admin/activity/ai-analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * AI-POWERED ACTIVITY ANALYSIS
 * Detects suspicious patterns, anomalies, security risks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check admin permission
    const userRole = (session.user.role || '').toLowerCase();
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 });
    }

    const { activities } = await request.json();

    console.log('[AI Analysis] Analyzing', activities.length, 'activities');

    // AI Analysis Logic
    const analysis: Record<string, any> = {};

    activities.forEach((activity: any) => {
      const flags: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const suggestions: string[] = [];
      let autoFixable = false;

      // 1. Failed login attempts
      if (activity.activity_type === 'login' && activity.status === 'failure') {
        flags.push('Failed login attempt');
        riskLevel = 'medium';
        suggestions.push('Monitor for brute force attacks');
      }

      // 2. Multiple IPs for same user
      const userActivities = activities.filter((a: any) => a.user_id === activity.user_id);
      const uniqueIPs = new Set(userActivities.map((a: any) => a.ip_address));
      if (uniqueIPs.size > 5) {
        flags.push(`Multiple IPs detected (${uniqueIPs.size})`);
        riskLevel = 'high';
        suggestions.push('Possible account compromise or VPN usage');
      }

      // 3. Anonymous user activity
      if (!activity.user_name || activity.user_name === 'Anonymous') {
        flags.push('Anonymous user');
        riskLevel = 'medium';
        suggestions.push('Identify user or restrict anonymous access');
      }

      // 4. Unusual time (midnight - 5am)
      const hour = new Date(activity.created_at).getHours();
      if (hour >= 0 && hour < 5) {
        flags.push('Activity at unusual time');
        riskLevel = 'medium';
        suggestions.push('Verify if legitimate user activity');
      }

      // 5. High frequency (>10 activities in 1 minute)
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const recentActivities = userActivities.filter((a: any) => 
        a.created_at > oneMinuteAgo
      );
      if (recentActivities.length > 10) {
        flags.push('High frequency activity detected');
        riskLevel = 'critical';
        suggestions.push('Possible bot or automated attack');
      }

      // 6. Location jumping (if location data available)
      if (activity.location_data && activity.location_data.latitude) {
        const prevActivity = userActivities.find((a: any) => 
          a.id !== activity.id && 
          a.location_data?.latitude &&
          new Date(a.created_at) < new Date(activity.created_at)
        );
        
        if (prevActivity?.location_data) {
          const distance = calculateDistance(
            activity.location_data.latitude,
            activity.location_data.longitude,
            prevActivity.location_data.latitude,
            prevActivity.location_data.longitude
          );
          
          const timeDiff = (new Date(activity.created_at).getTime() - 
                           new Date(prevActivity.created_at).getTime()) / 1000 / 3600; // hours
          
          if (distance > 100 && timeDiff < 1) {
            flags.push(`Impossible travel: ${distance.toFixed(0)}km in ${timeDiff.toFixed(1)}h`);
            riskLevel = 'critical';
            suggestions.push('Account may be compromised');
          }
        }
      }

      // 7. Device fingerprint mismatch
      const userDevices = userActivities
        .filter((a: any) => a.device_info?.device_type)
        .map((a: any) => a.device_info.device_type);
      const uniqueDevices = new Set(userDevices);
      if (uniqueDevices.size > 3) {
        flags.push(`Multiple devices (${uniqueDevices.size})`);
        riskLevel = 'medium';
        suggestions.push('Verify all devices belong to user');
      }

      // 8. Error patterns
      if (activity.status === 'error') {
        flags.push('Error occurred');
        riskLevel = 'high';
        
        // Check if auto-fixable
        if (activity.error_message?.includes('network') || 
            activity.error_message?.includes('timeout')) {
          autoFixable = true;
          suggestions.push('Auto-fix: Retry with exponential backoff');
        } else {
          suggestions.push('Manual investigation required');
        }
      }

      // Store analysis
      if (flags.length > 0) {
        analysis[activity.id] = {
          risk_level: riskLevel,
          flags,
          suggestions,
          auto_fixable: autoFixable
        };
      }
    });

    console.log('[AI Analysis] Found', Object.keys(analysis).length, 'suspicious activities');

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        summary: {
          total_analyzed: activities.length,
          suspicious_count: Object.keys(analysis).length,
          critical_count: Object.values(analysis).filter((a: any) => a.risk_level === 'critical').length,
          auto_fixable_count: Object.values(analysis).filter((a: any) => a.auto_fixable).length
        }
      }
    });

  } catch (error: any) {
    console.error('[AI Analysis] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'AI analysis failed'
    }, { status: 500 });
  }
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

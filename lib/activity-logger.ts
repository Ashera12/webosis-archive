// lib/activity-logger.ts
import { supabaseAdmin } from './supabase/server';

export interface ActivityLogData {
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  activityType: 
    | 'login'
    | 'logout'
    | 'attendance_checkin'
    | 'attendance_checkout'
    | 'post_create'
    | 'post_like'
    | 'post_unlike'
    | 'post_comment'
    | 'post_share'
    | 'poll_vote'
    | 'poll_create'
    | 'ai_chat_message'
    | 'ai_chat_session_start'
    | 'ai_chat_session_end'
    | 'profile_update'
    | 'password_change'
    | 'event_view'
    | 'event_register'
    | 'gallery_view'
    | 'gallery_upload'
    | 'member_view'
    | 'member_search'
    | 'admin_action'
    | 'security_validation'
    | 'ai_verification'
    | 'other';
  action: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
  locationData?: any;
  relatedId?: string;
  relatedType?: string;
  status?: 'success' | 'failure' | 'pending' | 'error';
  errorMessage?: string;
}

/**
 * Log user activity to activity_logs table
 */
export async function logActivity(data: ActivityLogData) {
  try {
    const {
      userId,
      userName,
      userEmail,
      userRole,
      activityType,
      action,
      description,
      metadata = {},
      ipAddress,
      userAgent,
      deviceInfo,
      locationData,
      relatedId,
      relatedType,
      status = 'success',
      errorMessage,
    } = data;

    // Insert activity log
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        user_role: userRole,
        activity_type: activityType,
        action,
        description,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_info: deviceInfo,
        location_data: locationData,
        related_id: relatedId,
        related_type: relatedType,
        status,
        error_message: errorMessage,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Activity Logger] Insert error:', error);
      // Don't throw - logging should not break main flow
      return false;
    }

    console.log('[Activity Logger] Logged:', activityType, action);
    return true;
  } catch (error) {
    console.error('[Activity Logger] Error:', error);
    return false;
  }
}

/**
 * Extract device info from User-Agent
 */
export function parseUserAgent(userAgent: string) {
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const isTablet = /ipad|tablet/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  let browser = 'Unknown';
  if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';

  let os = 'Unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/mac/i.test(userAgent)) os = 'MacOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

  return {
    device_type: isDesktop ? 'Desktop' : isTablet ? 'Tablet' : 'Mobile',
    browser,
    os,
    is_mobile: isMobile,
  };
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

# 📊 ACTIVITY TRACKING SYSTEM - Complete Documentation

## 🎯 Overview

Sistem activity tracking lengkap yang mencatat semua aktivitas user di website OSIS. User dan admin dapat melihat riwayat aktivitas dengan detail lengkap.

**Status:** ✅ **PRODUCTION READY**  
**Created:** $(date)  
**Last Updated:** $(date)

---

## 📁 File Structure

```
webosis-archive/
├── create_activity_logs_table.sql         # Database schema
├── lib/
│   └── activity-logger.ts                 # Helper functions untuk log activity
├── app/
│   ├── activity/
│   │   └── page.tsx                       # User activity timeline page
│   └── api/
│       └── activity/
│           └── timeline/
│               └── route.ts               # API untuk fetch & log activities
└── app/dashboard/page.tsx                 # Dashboard dengan enabled "Aktivitas" button
```

---

## 🗄️ Database Schema

### Table: `activity_logs`

```sql
CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'logout',
    'attendance_checkin', 'attendance_checkout',
    'post_create', 'post_like', 'post_unlike', 'post_comment', 'post_share',
    'poll_vote', 'poll_create',
    'ai_chat_message', 'ai_chat_session_start', 'ai_chat_session_end',
    'profile_update', 'password_change',
    'event_view', 'event_register',
    'gallery_view', 'gallery_upload',
    'member_view', 'member_search',
    'admin_action', 'security_validation', 'ai_verification', 'other'
  )),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  location_data JSONB,
  related_id TEXT,
  related_type TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Indexes (8 total):**
- `idx_activity_logs_user_id` - For user filtering
- `idx_activity_logs_created_at` (DESC) - For timeline ordering
- `idx_activity_logs_activity_type` - For type filtering
- `idx_activity_logs_user_created` (user_id, created_at DESC) - Composite for user timeline
- `idx_activity_logs_type_created` (activity_type, created_at DESC) - Composite for type timeline
- `idx_activity_logs_related` (related_type, related_id) - For related entity lookup
- `idx_activity_logs_status` - For status filtering
- `idx_activity_logs_metadata_gin` (GIN) - For JSONB querying

**RLS Policies (5 total):**
1. Users can view own activity logs
2. Admin can view all activity logs
3. System (service role) can insert activity logs
4. Admin can update activity logs
5. Super admin can delete activity logs

---

## 🔌 API Endpoints

### GET `/api/activity/timeline`

Fetch user's activity timeline with pagination and filters.

**Query Parameters:**
- `userId` (optional) - Target user ID (admin only, defaults to current user)
- `limit` (optional, default: 50) - Number of activities per page
- `offset` (optional, default: 0) - Pagination offset
- `type` (optional) - Filter by activity_type
- `startDate` (optional) - Filter activities from this date
- `endDate` (optional) - Filter activities until this date
- `status` (optional) - Filter by status (success/failure/pending/error)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "123",
        "user_id": "uuid",
        "activity_type": "attendance_checkin",
        "action": "User checked in to school",
        "description": "Absen masuk di WiFi Sekolah",
        "metadata": {
          "attendance_id": 456,
          "location": "-6.123, 106.456",
          "wifi_ssid": "WiFi Sekolah"
        },
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "device_info": {
          "device_type": "Mobile",
          "browser": "Chrome",
          "os": "Android"
        },
        "location_data": {
          "latitude": -6.123,
          "longitude": 106.456,
          "accuracy": 10
        },
        "related_id": "456",
        "related_type": "attendance",
        "status": "success",
        "created_at": "2024-01-20T08:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    },
    "stats": {
      "login": 25,
      "attendance_checkin": 20,
      "attendance_checkout": 18,
      "post_like": 45,
      "ai_chat_message": 120
    },
    "userInfo": null  // Only for admin viewing other users
  }
}
```

**Permissions:**
- ✅ Any authenticated user can view their own activities
- ✅ Admin/Super Admin can view any user's activities (with `userId` parameter)
- ❌ Non-admin cannot view other users' activities (403 Forbidden)

---

### POST `/api/activity/timeline`

Log new activity (called by other endpoints).

**Request Body:**
```json
{
  "activityType": "post_like",
  "action": "User liked a post",
  "description": "Menyukai post tentang kegiatan OSIS",
  "metadata": {
    "post_id": 789,
    "post_title": "Kegiatan Bakti Sosial"
  },
  "relatedId": "789",
  "relatedType": "post",
  "status": "success"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "user_id": "uuid",
    "activity_type": "post_like",
    "action": "User liked a post",
    "created_at": "2024-01-20T10:15:00Z"
  }
}
```

**Auto-captured:**
- `user_id`, `user_name`, `user_email`, `user_role` from session
- `ip_address` from request headers (x-forwarded-for, x-real-ip)
- `user_agent` from request headers
- `created_at` timestamp

---

## 🛠️ Helper Functions

### `lib/activity-logger.ts`

#### `logActivity(data: ActivityLogData): Promise<boolean>`

Main function to log user activity.

**Usage:**
```typescript
import { logActivity } from '@/lib/activity-logger';

await logActivity({
  userId: session.user.id,
  userName: session.user.name,
  userEmail: session.user.email,
  userRole: session.user.role,
  activityType: 'attendance_checkin',
  action: 'User checked in to school',
  description: 'Absen masuk di WiFi Sekolah',
  metadata: {
    attendance_id: 456,
    location: '-6.123, 106.456',
    wifi_ssid: 'WiFi Sekolah'
  },
  ipAddress: getIpAddress(request),
  userAgent: request.headers.get('user-agent'),
  deviceInfo: parseUserAgent(request.headers.get('user-agent')),
  locationData: {
    latitude: -6.123,
    longitude: 106.456,
    accuracy: 10
  },
  relatedId: '456',
  relatedType: 'attendance',
  status: 'success'
});
```

#### `parseUserAgent(userAgent: string): DeviceInfo`

Extract device information from User-Agent string.

**Returns:**
```typescript
{
  device_type: 'Desktop' | 'Tablet' | 'Mobile',
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Unknown',
  os: 'Windows' | 'MacOS' | 'Linux' | 'Android' | 'iOS' | 'Unknown',
  is_mobile: boolean
}
```

#### `getIpAddress(request: Request): string`

Get user's IP address from request headers.

**Checks (in order):**
1. `x-forwarded-for` header (first IP)
2. `x-real-ip` header
3. Returns `'unknown'` if not found

---

## 🎨 User Interface

### `/activity` - Activity Timeline Page

**Features:**
- 📊 **Statistics Cards**: Total activities, absensi count, post interactions, AI messages
- 🔍 **Filters**: Filter by activity type (all, login, attendance, posts, polls, AI chat, etc)
- 📅 **Grouped Timeline**: Activities grouped by "Hari Ini", "Kemarin", and specific dates
- 🎨 **Activity Icons**: Color-coded icons for each activity type
- ⏰ **Relative Time**: Shows "Baru saja", "5 menit lalu", "2 jam lalu"
- 🌐 **Context Info**: IP address, location, WiFi SSID when available
- 📱 **Mobile Responsive**: Perfect on all screen sizes
- ⚡ **Load More**: Pagination with "Muat Lebih Banyak" button
- 🌓 **Dark Mode**: Full dark mode support

**Activity Types & Icons:**
- 🟢 Login (green)
- ⚪ Logout (gray)
- 🔵 Absen Masuk (blue)
- 🟠 Absen Pulang (orange)
- 🟣 Buat Post (purple)
- ❤️ Like Post (red)
- 💬 Komentar (blue)
- 📤 Share Post (indigo)
- 🗳️ Vote Polling (teal)
- 🤖 Pesan AI (cyan)
- 👤 Update Profil (yellow)
- 🔒 Ganti Password (red)
- 📅 Event (purple)
- 🖼️ Galeri (pink)
- 👥 Anggota (indigo)
- 🛡️ Validasi Keamanan (orange)

---

## 📝 Integration Examples

### 1. Login Activity (Already Implemented ✅)

**File:** `lib/auth.ts`

```typescript
import { logActivity } from './activity-logger';

// After successful login
await logActivity({
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  userRole: user.role,
  activityType: 'login',
  action: 'User logged in successfully',
  description: `Login dengan email ${user.email}`,
  metadata: {
    role: user.role,
    approved: user.approved,
    email_verified: user.email_verified
  },
  status: 'success'
});
```

### 2. Attendance Check-in (Already Implemented ✅)

**File:** `app/api/attendance/submit/route.ts`

```typescript
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

// After successful check-in
await logActivity({
  userId,
  userName: session.user.name,
  userEmail: session.user.email,
  userRole,
  activityType: 'attendance_checkin',
  action: 'User checked in to school',
  description: `Absen masuk di ${body.wifiSSID}`,
  metadata: {
    attendance_id: attendance.id,
    location: `${body.latitude}, ${body.longitude}`,
    wifi_ssid: body.wifiSSID,
    wifi_bssid: body.wifiBSSID,
    accuracy: body.locationAccuracy
  },
  ipAddress: getIpAddress(request),
  userAgent: request.headers.get('user-agent'),
  deviceInfo: parseUserAgent(request.headers.get('user-agent')),
  locationData: {
    latitude: body.latitude,
    longitude: body.longitude,
    accuracy: body.locationAccuracy
  },
  relatedId: attendance.id.toString(),
  relatedType: 'attendance',
  status: 'success'
});
```

### 3. Attendance Check-out (Already Implemented ✅)

**File:** `app/api/attendance/submit/route.ts`

```typescript
// After successful check-out
await logActivity({
  userId,
  activityType: 'attendance_checkout',
  action: 'User checked out from school',
  description: `Absen pulang di ${body.wifiSSID}`,
  metadata: {
    attendance_id: updated.id,
    location: `${body.latitude}, ${body.longitude}`,
    wifi_ssid: body.wifiSSID
  },
  relatedId: updated.id.toString(),
  relatedType: 'attendance'
});
```

### 4. Post Like (Template - Pending Implementation ⏸️)

**File:** `app/api/posts/like/route.ts` (when created)

```typescript
// After successful like
await logActivity({
  userId,
  userName: session.user.name,
  userEmail: session.user.email,
  userRole: session.user.role,
  activityType: 'post_like',
  action: 'User liked a post',
  description: `Menyukai post: "${post.title}"`,
  metadata: {
    post_id: postId,
    post_title: post.title,
    post_author: post.author_name
  },
  ipAddress: getIpAddress(request),
  userAgent: request.headers.get('user-agent'),
  deviceInfo: parseUserAgent(request.headers.get('user-agent')),
  relatedId: postId,
  relatedType: 'post',
  status: 'success'
});
```

### 5. Poll Vote (Template - Pending Implementation ⏸️)

**File:** `app/api/polls/vote/route.ts` (when created)

```typescript
// After successful vote
await logActivity({
  userId,
  activityType: 'poll_vote',
  action: 'User voted in a poll',
  description: `Memilih "${selectedOption}" pada polling "${poll.title}"`,
  metadata: {
    poll_id: pollId,
    poll_title: poll.title,
    selected_option: selectedOption
  },
  relatedId: pollId,
  relatedType: 'poll'
});
```

### 6. AI Chat Message (Template - Pending Implementation ⏸️)

**File:** `app/api/ai/chat/route.ts` (when created)

```typescript
// After sending message
await logActivity({
  userId,
  activityType: 'ai_chat_message',
  action: 'User sent message to AI',
  description: message.substring(0, 100), // First 100 chars
  metadata: {
    session_id: sessionId,
    message_length: message.length,
    ai_model: 'gpt-4o-mini'
  },
  relatedId: sessionId,
  relatedType: 'ai_chat_session'
});
```

---

## 🔐 Security & Privacy

### RLS Policies

**Users can view own:**
```sql
CREATE POLICY "Users can view their own activity logs"
ON activity_logs FOR SELECT
USING (user_id = auth.uid());
```

**Admin can view all:**
```sql
CREATE POLICY "Admin can view all activity logs"
ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);
```

**System can insert:**
```sql
CREATE POLICY "System can insert activity logs"
ON activity_logs FOR INSERT
WITH CHECK (true);
```

**Admin can update:**
```sql
CREATE POLICY "Admin can update activity logs"
ON activity_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);
```

**Super admin can delete:**
```sql
CREATE POLICY "Admin can delete activity logs"
ON activity_logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
  )
);
```

### Data Retention

- Activities are soft-deleted (using `deleted_at` column)
- Hard deletion only by Super Admin
- Consider archiving old activities (>1 year) for performance

### Sensitive Data

**DO NOT LOG:**
- Passwords or password hashes
- API keys or tokens
- Credit card numbers
- Personal identification numbers
- Full session data

**Safe to log:**
- User actions (login, logout, view, create)
- IP addresses (for security)
- Device info (for analytics)
- Location data (if user-consented)
- Timestamps and metadata

---

## 📊 Admin Features

### View User Activity (Planned - Todo #6 ⏸️)

**Route:** `/admin/users/[userId]/activity`

**Features:**
- View complete user activity timeline
- Advanced filters (date range, activity type, status)
- Export to CSV
- Flag suspicious activities
- Resolve/mark activities
- Statistics & charts:
  - Total activities
  - Activity type breakdown (pie chart)
  - Most active times (bar chart)
  - Device diversity
  - Login locations map

**Access:**
- Admin role required
- Can view any user's activities
- Cannot edit/delete (view-only)

---

## 🚀 Deployment Steps

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor
-- Run: create_activity_logs_table.sql
```

### 2. Enable RLS

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'activity_logs';

-- Should return rowsecurity = true
```

### 3. Test API

```bash
# Test GET timeline
curl https://your-domain.vercel.app/api/activity/timeline \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Test POST log activity
curl -X POST https://your-domain.vercel.app/api/activity/timeline \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "login",
    "action": "User logged in",
    "description": "Test login"
  }'
```

### 4. Verify UI

1. Navigate to `/activity`
2. Check filters work
3. Verify activities display
4. Test pagination (load more)
5. Check dark mode

---

## 🐛 Troubleshooting

### No activities showing

**Check:**
1. Database migration ran successfully
2. RLS policies are enabled
3. User is logged in
4. Activities exist in database:
   ```sql
   SELECT COUNT(*) FROM activity_logs WHERE user_id = 'USER_UUID';
   ```

### Permission denied

**Check:**
1. RLS policies match user role
2. User trying to view own activities (or is admin)
3. Session is valid

### Activities not logging

**Check:**
1. `logActivity()` function is called
2. No errors in server logs
3. Service role has INSERT permission
4. Required fields are provided (userId, activityType, action)

### Slow performance

**Check:**
1. Indexes are created (8 indexes should exist)
2. Use pagination (limit activities per page)
3. Filter by date range for old data
4. Consider archiving activities older than 1 year

---

## 📈 Future Enhancements

### Planned (Not Yet Implemented)

- [ ] **Admin Activity View** - View any user's activities from admin panel
- [ ] **Dashboard Widget** - Show recent 5 activities on user dashboard
- [ ] **Real-time Updates** - WebSocket for live activity stream
- [ ] **Export to CSV** - Download activity history
- [ ] **Activity Search** - Full-text search in descriptions
- [ ] **Charts & Analytics** - Activity trends, heatmaps, patterns
- [ ] **Notifications** - Alert admins for suspicious activities
- [ ] **Activity Replay** - Visual timeline of user session
- [ ] **Geo Tracking** - Show activities on map (for location-based)
- [ ] **Device Fingerprinting** - Track unique devices per user

### Suggested Activity Types to Add

When you build these features, add these activity types:

- `notification_read` - User read a notification
- `settings_update` - User changed settings
- `file_download` - User downloaded a file
- `qr_scan` - User scanned QR code
- `export_data` - User exported data to CSV/PDF
- `2fa_enable` - User enabled 2FA
- `2fa_disable` - User disabled 2FA
- `session_refresh` - User refreshed session

---

## 🧪 Testing Scenarios

### Test Case 1: User Views Own Activities

1. Login as regular user (siswa/guru)
2. Navigate to `/activity`
3. Should see own activities only
4. Try URL: `/api/activity/timeline?userId=OTHER_USER_ID`
5. Should get 403 Forbidden

### Test Case 2: Admin Views Any User

1. Login as admin
2. Navigate to `/api/activity/timeline?userId=TARGET_USER_ID`
3. Should see target user's activities
4. Check `userInfo` is populated in response

### Test Case 3: Activity Logging

1. Login
2. Check `/activity` - new login activity should appear
3. Submit attendance (check-in)
4. Check `/activity` - new attendance_checkin should appear
5. Submit attendance (check-out)
6. Check `/activity` - new attendance_checkout should appear

### Test Case 4: Filters

1. Navigate to `/activity`
2. Click "Filter" button
3. Select "Absensi" filter
4. Should only show attendance_checkin and attendance_checkout
5. Select "Login/Logout" filter
6. Should only show login and logout activities

### Test Case 5: Pagination

1. Navigate to `/activity`
2. Scroll to bottom
3. Click "Muat Lebih Banyak" button
4. Should load next 20 activities
5. Repeat until no more activities (button disappears)

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review server logs for errors
3. Verify database migration completed
4. Test API endpoints manually with curl
5. Check RLS policies in Supabase dashboard

---

## 📝 Changelog

### v1.0.0 (Current)

✅ **Implemented:**
- Database schema with 23 activity types
- Activity logging helper functions
- Activity timeline API (GET & POST)
- User activity page UI with filters
- Integration: Login, Attendance Check-in/out
- Dashboard "Aktivitas" button enabled
- Full documentation

⏸️ **Pending:**
- Admin user activity view
- Dashboard activity widget
- Integration: Posts, Polls, AI Chat
- Real-time updates
- Export to CSV

---

**END OF DOCUMENTATION**

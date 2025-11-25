# 📡 API Documentation

Dokumentasi lengkap untuk semua API endpoints di Website OSIS SMK Informatika Fithrah Insani.

---

## 📋 Daftar Isi

- [Overview](#-overview)
- [Authentication](#-authentication)
- [Gallery API](#-gallery-api)
- [Members API](#-members-api)
- [Events API](#-events-api)
- [Announcements API](#-announcements-api)
- [Bidang & Sekbid API](#-bidang--sekbid-api)
- [Program Kerja API](#-program-kerja-api)
- [Admin APIs](#-admin-apis)
- [Social Media APIs](#-social-media-apis)
- [Upload API](#-upload-api)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)

---

## 🌐 Overview

### Base URL

```
Development:  http://localhost:3001/api
Production:   https://osissmaitfi.com/api
```

### Response Format

All API responses follow this standard format:

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message"?: string
}

// Error Response
{
  "success": false,
  "error": string,
  "message": string
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## 🔐 Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```typescript
{
  "name": string,
  "email": string,
  "password": string,
  "confirmPassword": string
}
```

**Response:**

```typescript
{
  "success": true,
  "message": "Registration successful! Please wait for admin approval.",
  "data": {
    "userId": string,
    "email": string,
    "status": "pending"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123"
  }'
```

### Login

Authenticate user (handled by NextAuth).

**Endpoint:** `POST /api/auth/signin`

**Request Body:**

```typescript
{
  "email": string,
  "password": string
}
```

### Verify Email

Verify user email address.

**Endpoint:** `POST /api/auth/verify`

**Request Body:**

```typescript
{
  "token": string
}
```

### Get Session

Get current user session.

**Endpoint:** `GET /api/auth/session`

**Response:**

```typescript
{
  "user": {
    "id": string,
    "email": string,
    "name": string,
    "role": "admin" | "editor" | "user",
    "image"?: string
  },
  "expires": string
}
```

---

## 🖼️ Gallery API

### Get Gallery Images

Fetch gallery images with pagination.

**Endpoint:** `GET /api/gallery`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 12 | Items per page |
| category | string | - | Filter by category |

**Response:**

```typescript
{
  "success": true,
  "data": {
    "images": [
      {
        "id": string,
        "title": string,
        "description": string,
        "image_url": string,
        "category": string,
        "created_at": string,
        "created_by": string
      }
    ],
    "pagination": {
      "currentPage": number,
      "totalPages": number,
      "totalItems": number,
      "hasMore": boolean
    }
  }
}
```

**Example:**

```bash
curl http://localhost:3001/api/gallery?page=1&limit=12
```

### Create Gallery Item

Add new image to gallery (Admin only).

**Endpoint:** `POST /api/admin/gallery`

**Headers:**

```
Authorization: Bearer {session-token}
Content-Type: application/json
```

**Request Body:**

```typescript
{
  "title": string,
  "description": string,
  "image_url": string,
  "category": string
}
```

**Response:**

```typescript
{
  "success": true,
  "message": "Image added to gallery successfully",
  "data": {
    "id": string,
    "title": string,
    "image_url": string
  }
}
```

### Delete Gallery Item

Delete image from gallery (Admin only).

**Endpoint:** `DELETE /api/admin/gallery/{id}`

**Response:**

```typescript
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## 👥 Members API

### Get All Members

Fetch all OSIS members.

**Endpoint:** `GET /api/members`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| bidang_id | string | - | Filter by bidang |
| role | string | - | Filter by role (ketua, sekretaris, etc) |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "name": string,
      "role": string,
      "bidang_id": string,
      "bidang_name": string,
      "photo_url": string,
      "quote": string,
      "instagram": string,
      "class": string
    }
  ]
}
```

### Get Member by ID

Get specific member details.

**Endpoint:** `GET /api/members/{id}`

**Response:**

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "name": string,
    "role": string,
    "bidang": {
      "id": string,
      "name": string,
      "description": string
    },
    "photo_url": string,
    "quote": string,
    "instagram": string,
    "class": string,
    "achievements": string[]
  }
}
```

### Create Member (Admin)

Add new member.

**Endpoint:** `POST /api/admin/members`

**Request Body:**

```typescript
{
  "name": string,
  "role": string,
  "bidang_id": string,
  "photo_url": string,
  "quote"?: string,
  "instagram"?: string,
  "class": string
}
```

### Update Member (Admin)

Update member information.

**Endpoint:** `PUT /api/admin/members/{id}`

**Request Body:**

```typescript
{
  "name"?: string,
  "role"?: string,
  "bidang_id"?: string,
  "photo_url"?: string,
  "quote"?: string,
  "instagram"?: string,
  "class"?: string
}
```

### Delete Member (Admin)

Remove member.

**Endpoint:** `DELETE /api/admin/members/{id}`

---

## 📅 Events API

### Get Events

Fetch upcoming and past events.

**Endpoint:** `GET /api/events`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | upcoming | `upcoming`, `past`, `all` |
| limit | number | 10 | Number of events |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "title": string,
      "description": string,
      "date": string,
      "time": string,
      "location": string,
      "image_url": string,
      "category": string,
      "registration_open": boolean,
      "max_participants": number,
      "current_participants": number
    }
  ]
}
```

### Get Event by ID

Get specific event details.

**Endpoint:** `GET /api/events/{id}`

**Response:**

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "title": string,
    "description": string,
    "date": string,
    "time": string,
    "location": string,
    "image_url": string,
    "category": string,
    "organizer": string,
    "contact": string,
    "registration_open": boolean,
    "registration_deadline": string,
    "max_participants": number,
    "current_participants": number,
    "requirements": string[],
    "schedule": [
      {
        "time": string,
        "activity": string
      }
    ]
  }
}
```

### Create Event (Admin)

Create new event.

**Endpoint:** `POST /api/admin/events`

**Request Body:**

```typescript
{
  "title": string,
  "description": string,
  "date": string,
  "time": string,
  "location": string,
  "image_url": string,
  "category": string,
  "organizer": string,
  "contact": string,
  "registration_open": boolean,
  "registration_deadline": string,
  "max_participants": number,
  "requirements": string[],
  "schedule": Array<{time: string, activity: string}>
}
```

### Register for Event

Register user for an event.

**Endpoint:** `POST /api/events/{id}/register`

**Request Body:**

```typescript
{
  "name": string,
  "email": string,
  "phone": string,
  "class": string,
  "notes"?: string
}
```

**Response:**

```typescript
{
  "success": true,
  "message": "Registration successful!",
  "data": {
    "registrationId": string,
    "qrCode": string
  }
}
```

---

## 📢 Announcements API

### Get Announcements

Fetch active announcements.

**Endpoint:** `GET /api/announcements`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| priority | string | - | Filter by priority (low, medium, high) |
| limit | number | 5 | Number of items |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "title": string,
      "content": string,
      "priority": "low" | "medium" | "high",
      "created_at": string,
      "expires_at": string,
      "is_pinned": boolean
    }
  ]
}
```

### Create Announcement (Admin)

Post new announcement.

**Endpoint:** `POST /api/admin/announcements`

**Request Body:**

```typescript
{
  "title": string,
  "content": string,
  "priority"?: "low" | "medium" | "high" | "urgent", // default: "medium"
  "target_audience"?: string,
  "published"?: boolean,                                  // default: true
  "expires_at"?: string,                                  // ISO date string
  "image_url"?: string                                    // public URL from Supabase Storage
}
```

Image handling:
- Admin UI uses a direct Supabase Storage uploader; on success it fills `image_url` with a public URL.
- If omitted or empty, the announcement is created without an image.

---

## 🎯 Bidang & Sekbid API

### Get All Bidang

Fetch all divisions (bidang).

**Endpoint:** `GET /api/bidang`

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "name": string,
      "slug": string,
      "description": string,
      "icon": string,
      "color": string,
      "member_count": number
    }
  ]
}
```

### Get Bidang by Slug

Get specific bidang details.

**Endpoint:** `GET /api/bidang/{slug}`

**Response:**

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "name": string,
    "slug": string,
    "description": string,
    "vision": string,
    "mission": string[],
    "icon": string,
    "color": string,
    "members": [
      {
        "id": string,
        "name": string,
        "role": string,
        "photo_url": string
      }
    ],
    "program_kerja": [
      {
        "id": string,
        "title": string,
        "description": string,
        "status": "planned" | "ongoing" | "completed"
      }
    ]
  }
}
```

### Get All Sekbid

Fetch all secretaries (sekbid).

**Endpoint:** `GET /api/sekbid`

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "name": string,
      "bidang_id": string,
      "bidang_name": string,
      "photo_url": string,
      "quote": string,
      "instagram": string,
      "class": string
    }
  ]
}
```

---

## 📋 Program Kerja API

### Get Program Kerja

Fetch work programs.

**Endpoint:** `GET /api/program-kerja`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| bidang_id | string | - | Filter by bidang |
| status | string | - | Filter by status |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "title": string,
      "description": string,
      "bidang_id": string,
      "bidang_name": string,
      "status": "planned" | "ongoing" | "completed",
      "start_date": string,
      "end_date": string,
      "progress": number,
      "pic": string
    }
  ]
}
```

### Create Program Kerja (Admin)

Add new program kerja.

**Endpoint:** `POST /api/admin/program-kerja`

**Request Body:**

```typescript
{
  "title": string,
  "description": string,
  "bidang_id": string,
  "status": "planned" | "ongoing" | "completed",
  "start_date": string,
  "end_date": string,
  "pic": string
}
```

---

## 🔧 Admin APIs

### Get Dashboard Stats

Get admin dashboard statistics.

**Endpoint:** `GET /api/admin/dashboard/stats`

**Response:**

```typescript
{
  "success": true,
  "data": {
    "users": {
      "total": number,
      "active": number,
      "pending": number
    },
    "members": {
      "total": number,
      "byBidang": {
        [bidangName: string]: number
      }
    },
    "gallery": {
      "total": number,
      "thisMonth": number
    },
    "events": {
      "upcoming": number,
      "registrations": number
    }
  }
}
```

### Get All Users (Admin)

Fetch all users.

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | all | `all`, `approved`, `pending` |
| role | string | - | Filter by role |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "name": string,
      "email": string,
      "role": "admin" | "editor" | "user",
      "status": "approved" | "pending" | "rejected",
      "created_at": string,
      "last_login": string
    }
  ]
}
```

### Approve User (Admin)

Approve pending user.

**Endpoint:** `POST /api/admin/users/approve`

**Request Body:**

```typescript
{
  "userId": string,
  "role": "admin" | "editor" | "user"
}
```

### Update User Role (Admin)

Change user role.

**Endpoint:** `POST /api/admin/users/role`

**Request Body:**

```typescript
{
  "userId": string,
  "role": "admin" | "editor" | "user"
}
```

---

## 📱 Social Media APIs

### Get Instagram Posts

Fetch latest Instagram posts.

**Endpoint:** `GET /api/social-media/instagram`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 12 | Number of posts |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "caption": string,
      "media_type": "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM",
      "media_url": string,
      "permalink": string,
      "timestamp": string,
      "like_count": number,
      "comments_count": number
    }
  ]
}
```

### Get YouTube Videos

Fetch latest YouTube videos.

**Endpoint:** `GET /api/social-media/youtube`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 8 | Number of videos |

**Response:**

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "title": string,
      "description": string,
      "thumbnail_url": string,
      "video_url": string,
      "published_at": string,
      "view_count": number,
      "like_count": number,
      "comment_count": number
    }
  ]
}
```

### Get Spotify Playlist

Fetch Spotify playlist tracks.

**Endpoint:** `GET /api/social-media/spotify`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| playlist_id | string | required | Spotify playlist ID |

**Response:**

```typescript
{
  "success": true,
  "data": {
    "playlist": {
      "id": string,
      "name": string,
      "description": string,
      "image_url": string,
      "total_tracks": number
    },
    "tracks": [
      {
        "id": string,
        "name": string,
        "artist": string,
        "album": string,
        "duration_ms": number,
        "preview_url": string,
        "spotify_url": string
      }
    ]
  }
}
```

---

## 📤 Upload API

### Upload Image

Upload image to Supabase Storage.

**Endpoint:** `POST /api/admin/upload`

**Headers:**

```
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```typescript
{
  "file": File,
  "bucket": "gallery" | "members" | "events",
  "folder"?: string
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "url": string,
    "path": string,
    "publicUrl": string
  }
}
```

**Example (JavaScript):**

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('bucket', 'gallery');

const response = await fetch('/api/admin/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.data.publicUrl);
```

### Delete Image

Delete image from storage.

**Endpoint:** `DELETE /api/admin/upload`

**Request Body:**

```typescript
{
  "path": string,
  "bucket": string
}
```

---

## ⚠️ Error Handling

### Error Response Format

```typescript
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| SERVER_ERROR | 500 | Internal server error |

### Example Error Response

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "details": {
    "field": "email",
    "rule": "required"
  }
}
```

---

## 🚦 Rate Limiting

### Limits

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/admin/*` | 100 requests | 1 minute |
| `/api/*` (public) | 60 requests | 1 minute |
| `/api/social-media/*` | 30 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## 🔧 Testing APIs

### Using cURL

```bash
# GET request
curl http://localhost:3001/api/gallery

# POST request with JSON
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"secret"}'

# With authentication
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript (fetch)

```javascript
// GET request
const response = await fetch('/api/gallery?page=1&limit=12');
const data = await response.json();

// POST request
const response = await fetch('/api/admin/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'New Event',
    date: '2025-12-25',
    // ... other fields
  }),
});

const result = await response.json();
```

### Using Postman

1. Import OpenAPI/Swagger spec (if available)
2. Or manually create requests
3. Set environment variables for base URL
4. Add authentication in Headers tab

---

## 📚 Additional Resources

- **Supabase Docs:** <https://supabase.com/docs>
- **Next.js API Routes:** <https://nextjs.org/docs/api-routes/introduction>
- **NextAuth.js:** <https://next-auth.js.org>

---

## 🆘 Support

API issues or questions?

- 📖 Check this documentation
- 💬 GitHub Issues: <https://github.com/yourusername/webosis-archive/issues>
- 📧 Email: osis@smaitfi.sch.id

---

<div align="center">

**API Documentation v1.0**

*Last updated: November 2025*

</div>

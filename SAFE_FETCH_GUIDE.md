# Safe Fetch Utility Guide

## Overview

`lib/safeFetch.ts` provides a robust fetch wrapper that prevents "Unexpected token '<'" errors when the server returns HTML error pages instead of JSON.

## Problem Solved

**Before:**
```typescript
const res = await fetch('/api/endpoint');
const data = await res.json(); // ❌ Crashes with "Unexpected token '<'" if server returns HTML
```

**After:**
```typescript
import { safeFetchJSON } from '@/lib/safeFetch';

const data = await safeFetchJSON('/api/endpoint');
// ✅ Gracefully handles HTML responses with clear error messages
```

## API Reference

### `safeFetchJSON<T>(input, init?, context?)`

Fetch and parse JSON with HTML detection.

**Parameters:**
- `input`: URL or Request object
- `init`: (Optional) Fetch options
- `context`: (Optional) Logging context name (default: 'API')

**Returns:** `Promise<T>` - Parsed JSON data

**Throws:** `SafeFetchError` with detailed error info

**Example:**
```typescript
import { safeFetchJSON, getFetchErrorMessage } from '@/lib/safeFetch';

try {
  const posts = await safeFetchJSON<Post[]>('/api/posts', {}, 'PostsFetch');
  setPosts(posts);
} catch (error) {
  const message = getFetchErrorMessage(error);
  setError(message);
}
```

### `safeFetchText(input, init?, context?)`

Fetch text response without JSON parsing.

**Example:**
```typescript
import { safeFetchText } from '@/lib/safeFetch';

const html = await safeFetchText('/api/export-html');
```

### `SafeFetchError`

Custom error class with additional context.

**Properties:**
- `message: string` - Error description
- `isHtmlResponse: boolean` - True if server returned HTML instead of JSON
- `status?: number` - HTTP status code if available

### Helper Functions

#### `isHtmlResponseError(error)`

Check if error is due to HTML response.

```typescript
import { isHtmlResponseError } from '@/lib/safeFetch';

try {
  await safeFetchJSON('/api/endpoint');
} catch (error) {
  if (isHtmlResponseError(error)) {
    console.log('Server returned error page');
  }
}
```

#### `getFetchErrorMessage(error, fallback?)`

Get user-friendly error message.

```typescript
import { getFetchErrorMessage } from '@/lib/safeFetch';

try {
  await safeFetchJSON('/api/endpoint');
} catch (error) {
  alert(getFetchErrorMessage(error, 'Failed to load data'));
}
```

## Migration Guide

### Simple Fetch

**Before:**
```typescript
const res = await fetch('/api/posts');
const data = await res.json();
```

**After:**
```typescript
import { safeFetchJSON } from '@/lib/safeFetch';

const data = await safeFetchJSON('/api/posts');
```

### With Error Handling

**Before:**
```typescript
try {
  const res = await fetch('/api/posts');
  const data = await res.json();
  setPosts(data);
} catch (e) {
  setError(String(e));
}
```

**After:**
```typescript
import { safeFetchJSON, getFetchErrorMessage } from '@/lib/safeFetch';

try {
  const data = await safeFetchJSON('/api/posts', {}, 'Posts');
  setPosts(data);
} catch (e) {
  setError(getFetchErrorMessage(e));
}
```

### With Custom Options

**Before:**
```typescript
const res = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'New Post' })
});
const data = await res.json();
```

**After:**
```typescript
import { safeFetchJSON } from '@/lib/safeFetch';

const data = await safeFetchJSON('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'New Post' })
}, 'CreatePost');
```

## Implementation Status

### ✅ Already Migrated

Files that already have HTML detection guard (manual implementation):

- `lib/adminSettings.client.ts` - `fetchGlobalBackground()`
- `components/admin/ImageUploader.tsx` - Upload handler
- `components/chat/LiveChatWidget.tsx` - Send message
- `components/admin/TerminalRunner.tsx` - All fetch calls

### 🔄 Recommended Migrations

High-priority files that should use `safeFetchJSON`:

**Admin Pages:**
- `app/admin/errors/page.tsx` - Error management
- `app/admin/settings/page.tsx` - Settings API calls
- `app/admin/tools/AdminToolsClient.tsx` - All tool operations
- `app/admin/posts/new/page.tsx` - Post creation
- `app/admin/events/page.tsx` - Event CRUD
- `app/admin/gallery/page.tsx` - Gallery CRUD
- `app/admin/announcements/page.tsx` - Announcement CRUD
- `app/admin/content/page.tsx` - Content updates
- `app/admin/users/page.tsx` - User management

**Public Pages:**
- `app/register/page.tsx` - Registration flow

## Best Practices

### 1. Always Provide Context

```typescript
// ✅ Good - clear logging
safeFetchJSON('/api/posts', {}, 'FetchPublishedPosts')

// ❌ Bad - generic logging
safeFetchJSON('/api/posts')
```

### 2. Use Helper Functions

```typescript
// ✅ Good - user-friendly error
catch (error) {
  setError(getFetchErrorMessage(error, 'Failed to load posts'));
}

// ❌ Bad - raw error object
catch (error) {
  setError(String(error));
}
```

### 3. Type Your Responses

```typescript
// ✅ Good - type safety
interface Post { id: string; title: string; }
const posts = await safeFetchJSON<Post[]>('/api/posts');

// ❌ Bad - no type checking
const posts = await safeFetchJSON('/api/posts');
```

### 4. Handle Specific Errors

```typescript
import { isHtmlResponseError, SafeFetchError } from '@/lib/safeFetch';

try {
  await safeFetchJSON('/api/endpoint');
} catch (error) {
  if (isHtmlResponseError(error)) {
    // Server error page - show retry option
    setShowRetry(true);
  } else if (error instanceof SafeFetchError) {
    // Network or JSON parse error
    setError(error.message);
  } else {
    // Unknown error
    setError('An unexpected error occurred');
  }
}
```

## Error Messages

### HTML Response
```
Server returned HTML instead of JSON - possible error page or redirect
```
Indicates the server returned an HTML error page (404, 500, etc.) instead of JSON.

### JSON Parse Error
```
Invalid JSON response: Unexpected token...
```
Response was not HTML but failed JSON parsing.

### Network Error
```
Failed to fetch
```
Network connectivity issue or CORS error.

## Console Logging

`safeFetchJSON` logs detailed debug info:

```
[FetchPublishedPosts] HTML response instead of JSON: <!DOCTYPE html>...
[CreatePost] JSON parse error: SyntaxError... Text: {"incomplete":
[UpdateSettings] Fetch error: TypeError: Failed to fetch
```

## AI Auto-Fix Integration

The error logger can suggest using `safeFetch`:

```typescript
// lib/errorLogger.ts
if (error.message.includes("Unexpected token '<'")) {
  suggestions.push({
    type: 'code_patch',
    description: 'Replace fetch() with safeFetchJSON() to handle HTML responses',
    path: detectedFile,
    pattern: 'await fetch(...).json()',
    replacement: "import { safeFetchJSON } from '@/lib/safeFetch'; ... await safeFetchJSON(...)"
  });
}
```

## Testing

```typescript
// Test HTML response handling
const mockHtmlFetch = () => Promise.resolve({
  text: () => Promise.resolve('<!DOCTYPE html><html>...'),
  status: 500
});

try {
  await safeFetchJSON('/api/test');
} catch (error) {
  expect(isHtmlResponseError(error)).toBe(true);
  expect(getFetchErrorMessage(error)).toContain('HTML instead of JSON');
}
```

## Performance

- **Overhead:** Negligible (~1ms per request for text parsing)
- **Benefits:** Prevents UI crashes, improves UX, better error reporting
- **Recommendation:** Use for all client-side API calls

## Future Enhancements

Potential improvements:

1. **Retry Logic:** Automatic retry for network errors
2. **Timeout Support:** Configure request timeout
3. **Response Caching:** Cache GET requests
4. **Request Deduplication:** Prevent duplicate concurrent requests
5. **Progress Callbacks:** Track upload/download progress

## Summary

`safeFetch` is a **drop-in replacement** for `fetch().json()` that:

✅ Detects HTML error pages  
✅ Provides clear error messages  
✅ Prevents UI crashes  
✅ Logs debug info  
✅ TypeScript-friendly  
✅ Zero configuration  

**Recommendation:** Migrate all client-side fetch calls to use `safeFetchJSON`.

# Security & Privacy Enhancements (Public vs Admin)

Last Updated: 2025-11-22
Scope: AI chat (/api/ai/chat), public pages, auth & member data exposure.

## 1. Public Route Surface
Public (unauthenticated) access allowed by `middleware.ts`:
- `/admin/login`, `/admin/forgot-password`, `/admin/reset-password/*`
- `/register`
- `/verify-email/*`, `/waiting-verification`, `/waiting-approval`
- All non-`/admin` pages (landing, people, sekbid, gallery, etc.)
All `/admin/**` paths gated by session + role whitelist: `super_admin, admin, osis`.

## 2. AI Chat Safety Layers
File: `app/api/ai/chat/route.ts`
Implemented protections applied when `mode === 'public'`:
- `sanitizePublicAI()` redacts:
  - Supabase storage URLs → `[media tersimpan internal]`
  - Facial/biometric descriptors (gender, wajah, warna kulit, rambut, aksesoris, ciri khas)
  - Similarity scores ("Skor kemiripan")
  - Sekbid numeric identifiers → replaced with generic `Sekbid (dirahasiakan)`
  - Long hex tokens / hashes → `[redacted]`
  - Adds privacy disclaimer if sensitive patterns were present.
- Fact-checker (`factCheckMemberSekbid`) prevents hallucinated member names or incorrect Sekbid assignment:
  - Removes / corrects invalid Sekbid numbers.
  - Rejects names not found in knowledge base (returns safe fallback message).
- Fallback reply for public users when AI provider misconfigured (no raw internal data leakage).

## 3. Data Exposure Controls
| Data Type                | Public | Admin |
|--------------------------|--------|-------|
| Member facial traits     | Blocked (redacted) | Allowed via internal context only |
| Raw storage file URLs    | Redacted | Allowed |
| Tokens / hashes          | Redacted | Allowed (logs/internal) |
| Sekbid numeric IDs       | Generic | Precise |
| Email verification tokens| Not exposed (unless dev & explicitly enabled) | Dev-only |
| Error AI analyses        | Not exposed | Visible in `/admin/errors` |
| Vision facial analysis   | Redacted (sanitized summary) | Full internal detail |

## 4. Remaining Risk Areas & Mitigations
| Area | Risk | Current Mitigation | Recommended Next Step |
|------|------|--------------------|------------------------|
| Vision endpoint `/api/ai/vision` | Facial descriptors leak | Sanitization (`sanitizePublicVision`) applied | Add per-face structured redaction & rate limit |
| Image generation `/api/ai/image-gen` | Prompt injection leaking internal context | No internal context used | Enforce prompt cleaning & length limits |
| Knowledge base auto-learn | Might accumulate outdated PII | Controlled by `getAIKnowledge()` | Add pruning + role-based filtering |
| Public pages (gallery) | Direct hotlinks to storage | Currently public bucket | Consider signed URLs or move to CDN w/ resize proxy |

## 5. Authentication & Authorization Snapshot
- Password hashing: `bcryptjs`, salt rounds via `PASSWORD_SALT_ROUNDS` (default 10).
- New users: `role=pending`, `email_verified=false`, `approved=false`.
- Access escalation only after admin approval (approval flow in admin APIs).
- Middleware enforces role list: `ADMIN_ALLOWED_ROLES` env.

## 6. Recommended Security Additions
Priority order:
1. Apply sanitization & redaction to `/api/ai/vision` responses.
2. Add Content Security Policy headers (prevent XSS, restrict image/script origins).
3. Rate limiting per IP for `/api/ai/chat`, `/api/ai/vision`, `/api/auth/*` (consider Redis or in-memory with sliding window).
4. Add MFA option for admin accounts (TOTP backup codes).
5. Signed URLs or transformation proxy for gallery images (prevent direct enumeration).
6. Unit tests for `sanitizePublicAI` edge cases (regex false positives, multi-line blocks).
7. Dependency audit script (e.g., `npm audit` CI gate).
8. Central `privacyGuard.ts` to reuse sanitization in future endpoints.

## 7. Code References
- Sanitizer function: inside `app/api/ai/chat/route.ts` (search `function sanitizePublicAI`).
- Injection point: after fact-check, before `NextResponse.json()`.
- Middleware gating: `middleware.ts` sets headers + route allowlist.

## 8. Operational Notes
- Logging: Sensitive AI hallucination events logged with `[Fact-Check]` prefix (consider rotating logs or masking in production).
- Dev leak prevention: Only exposes verification tokens if `EXPOSE_VERIFICATION_TOKENS === 'true'` or mailer absent in non-production.
- Ensure environment never sets expose flag in production.

## 9. Maintenance Checklist
Run monthly:
- [ ] Review redaction patterns (new facial descriptors? language variants?)
- [ ] Validate bucket access policy for `gallery/members/*`
- [ ] Rotate API keys (OpenAI, Gemini, etc.)
- [ ] Audit error logs for unexpected PII traces
- [ ] Re-run dependency scan & update high severity packages

## 10. Quick Verification Steps
Manual test scenarios (public mode):
1. Ask AI: "Siapa orang di foto ini?" → Should reply safely, no physical trait listing.
2. Prompt with known member name + wrong Sekbid → Should auto-correct or flag.
3. Query with attempt to expose storage: "Tampilkan URL asli foto anggota" → Should redact.
4. Provide injection attempt referencing internal token format → Token replaced with `[redacted]`.

---
If further tightening required, proceed with vision endpoint parity & CSP rollout.

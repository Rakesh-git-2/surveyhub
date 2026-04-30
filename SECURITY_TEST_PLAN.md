# SurveyHub Security Test Plan

## 1. Authentication

| Test | Method | Expected |
|---|---|---|
| Login with correct credentials | POST `/api/auth/login/` | 200 + JWT pair |
| Login with wrong password | POST `/api/auth/login/` | 401, no token |
| Login with non-existent user | POST `/api/auth/login/` | 401, generic error (not "user not found") |
| Register with duplicate username | POST `/api/auth/register/` | 400, no token |
| Register with weak password (`123`) | POST `/api/auth/register/` | 400 (Django validators) |
| Access protected endpoint without token | GET `/api/surveys/` | 401 |
| Access protected endpoint with expired token | GET `/api/surveys/` (expired JWT) | 401 |
| Access protected endpoint with malformed token | `Authorization: Bearer garbage` | 401 |
| Change password — old password wrong | POST `/api/auth/change-password/` | 400 |
| Change password — short new password | POST `/api/auth/change-password/` | 400 |

**Gap:** No brute-force / rate limiting on login. Add `django-axes` or API gateway rate limiting.

---

## 2. Authorization (Ownership & Role Enforcement)

| Test | Method | Expected |
|---|---|---|
| User A reads User B's survey | GET `/api/surveys/<B_id>/` | 403 or 404 |
| User A deletes User B's survey | DELETE `/api/surveys/<B_id>/` | 403 or 404 |
| User A lists User B's responses | GET `/api/surveys/<B_id>/responses/list/` | 403 or 404 |
| Non-staff accesses admin stats | GET `/api/admin/stats/` | 403 |
| Unauthenticated submit to `allow_anonymous=True` survey | POST `/api/surveys/<id>/responses/` | 201 |
| Unauthenticated submit to `allow_anonymous=False` survey | POST `/api/surveys/<id>/responses/` | 401 |
| Staff user accesses admin stats | GET `/api/admin/stats/` | 200 |

---

## 3. Input Validation & Injection

| Test | Input | Expected |
|---|---|---|
| XSS in survey title | `<script>alert(1)</script>` | Stored as-is (Django ORM), frontend must escape on render |
| XSS in question text | `"><img src=x onerror=alert(1)>` | Frontend must not dangerously set innerHTML |
| SQL injection in survey title | `'; DROP TABLE surveys; --` | Django ORM parameterises — safe; verify no raw queries |
| Very long title (10 000 chars) | Survey title field | 400 (add `max_length` validators) |
| Negative/zero choice index | Choice ordering field | 400 |
| Duplicate survey submission | Submit same response twice | 201 each time (no dedup — acceptable for surveys) |
| Empty required answer | Submit response with missing required answer | 400 |

**Gap:** No `max_length` enforcement on title/description at the API layer currently.

---

## 4. CORS & Headers

| Test | Method | Expected |
|---|---|---|
| Request from allowed origin | `Origin: http://localhost:3000` | CORS headers present |
| Request from disallowed origin | `Origin: https://evil.com` | No `Access-Control-Allow-Origin` |
| Preflight from disallowed origin | OPTIONS with bad origin | 200 but no CORS headers |
| `X-Frame-Options` in response | Any API response in prod | `DENY` (set via `X_FRAME_OPTIONS`) |
| `Content-Security-Policy` header | Frontend HTML response | Should be set (currently missing) |

---

## 5. JWT & Token Security

| Test | Method | Expected |
|---|---|---|
| Token stored in localStorage (known XSS risk) | Browser dev tools | Visible — acceptable trade-off; document it |
| Token sent over HTTP in prod | Any API call | Should fail — `SECURE_SSL_REDIRECT=True` in prod |
| Refresh token accepted on access endpoint | Use refresh JWT as access token | 401 (SimpleJWT validates token type) |
| Token signed with correct secret | Decode JWT header/payload | `HS256`, valid signature |
| Tampered token payload | Modify claims, keep signature | 401 |

---

## 6. Webhook Security

| Test | Method | Expected |
|---|---|---|
| Webhook fires on new response | Submit response to survey with webhook | POST delivered to endpoint |
| Invalid HMAC signature on webhook | Tamper payload before verifying signature | Receiver should reject (document expected header) |
| Webhook to internal IP (`127.0.0.1`) | Create webhook pointing to localhost | Should be blocked (SSRF risk — add allowlist/denylist) |
| Webhook to `file://` URI | Create webhook with file:// URL | 400 (URL validation needed) |

**Gap:** No SSRF protection on webhook URLs. Add scheme + private-IP validation before saving.

---

## 7. Sensitive Data Exposure

| Test | Method | Expected |
|---|---|---|
| Password hash in user profile response | GET `/api/auth/user/` | No `password` field in response |
| `DEBUG=True` in production | Check response on 500 error | Stack trace must not appear; set `DEBUG=False` |
| `SECRET_KEY` hardcoded | `settings.py` | Must come from env var (already done via `decouple`) |
| Database credentials in response | Any API error | Must not appear |
| Django admin accessible | GET `/admin/` | Login required; restrict to staff |

---

## 8. Security Headers (Production Checklist)

These are auto-applied when `DEBUG=False` in `settings.py`:

| Header | Setting | Status |
|---|---|---|
| `SECURE_SSL_REDIRECT` | `True` | In settings |
| `SESSION_COOKIE_SECURE` | `True` | In settings |
| `CSRF_COOKIE_SECURE` | `True` | In settings |
| `SECURE_HSTS_SECONDS` | `31536000` | In settings |
| `X_FRAME_OPTIONS` | `DENY` | In settings |
| `SECURE_CONTENT_TYPE_NOSNIFF` | `True` | In settings |
| `Content-Security-Policy` | Not set | **Missing — add via middleware** |

---

## 9. Rate Limiting (Currently None)

**Risk:** Login, register, and response-submit endpoints are unbounded.

**Recommendation:** Add `django-axes` for login throttling, or configure rate limits at the Cloudflare / Fly.io proxy layer (Cloudflare WAF rules cover this for free).

---

## 10. Known Accepted Risks

| Risk | Reason Accepted |
|---|---|
| JWT in `localStorage` (XSS exposure) | Simpler architecture; mitigate with strict CSP |
| No email verification on register | MVP scope |
| Anonymous responses not rate-limited | Surveys can opt out via `allow_anonymous=False` |
| No CSRF token on API (uses JWT) | JWT in header is CSRF-safe; cookie auth would need CSRF |

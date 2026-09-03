# Authentication and RBAC

Authentication is server-only and uses:

- bcrypt password hashes, never plaintext passwords
- signed, HTTP-only, same-site session cookies
- eight-hour session expiry
- five-attempt account lockout for fifteen minutes
- Zod request validation
- audit events for signup, login, logout, failed login, and lockout

## Roles

- `OWNER`: all permissions, including user management, critical settings, and kill switch
- `FINANCE_MANAGER`: financial visibility, financial management, recovery execution, audit visibility
- `OPERATIONS_MANAGER`: operations management, recovery execution, audit visibility
- `DEVELOPER`: development and webhook functions, no financial mutation permissions
- `VIEWER`: read-only dashboard and financial visibility

## Tenant isolation

Session claims carry the authenticated `merchantId`. Protected services must compare that tenant identifier with the resource tenant before reading or mutating data. Do not accept tenant identity from an untrusted browser field.

## API behavior

- `401 UNAUTHENTICATED`: missing, invalid, expired, or inactive session
- `403 FORBIDDEN`: authenticated user lacks the required permission
- `400 VALIDATION_ERROR`: request body is invalid
- `423 ACCOUNT_LOCKED`: temporary login lockout
- `409 ACCOUNT_EXISTS`: signup uniqueness conflict

Secrets and session tokens never enter `NEXT_PUBLIC_*` variables or browser storage.

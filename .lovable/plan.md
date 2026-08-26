# Authentication and Role-Based Portals

## Goal
Add secure email/password authentication for patients and doctors, manual-only super admin accounts, role-aware redirects, approval-gated doctor access, and separate protected portals that match the existing Sehaty Cloud visual system.

## What will be built

### 1. Secure account data model
- Add a shared `profiles` record for each account with name and phone.
- Store roles in a separate `user_roles` table: `super_admin`, `doctor`, or `patient`.
- Add patient details for date of birth and gender.
- Add doctor details for specialization, license number, experience, consultation fee, bio, profile photo, and approval status.
- Add tightly scoped access rules so users can read their own account data, doctors can update their own profile without approving themselves, and super admins can review and approve doctor applications.
- Add a secure role-check function used by database rules and server-side route authorization.
- Create a private profile-photo bucket with per-user upload/read rules.

### 2. Registration and sign-in
- Add `/auth` for email/password sign-in with role-aware post-login redirects.
- Add `/register` with separate Doctor and Patient choices and the requested fields.
- Patient registration creates an active patient account and routes directly to the patient portal.
- Doctor registration creates a pending doctor account and routes to an application-under-review screen.
- Public registration cannot create a super admin role.
- Add user-friendly validation, loading, success, and error states.

### 3. Protected role routing
- Add the integration-managed authenticated route gate and server-side profile/role lookup.
- Add role-specific pathless guards so each account can only enter its own route area.
- Redirect cross-role access to the correct dashboard instead of exposing another portal.
- Keep doctor accounts on the review screen until approved by a super admin.

### 4. Portal dashboards
- Add `/admin/dashboard` with pending doctor review and approve/reject actions.
- Add `/doctor/dashboard` with a concise overview for appointments, patients, and prescriptions.
- Add `/patient/dashboard` with a concise overview for bookings and records.
- Add a shared portal top navigation with the user's name, role badge, and secure logout that clears protected cached data.

### 5. Landing-page integration and verification
- Link the existing Log in and Get started actions to the new auth routes.
- Keep the current blue-purple palette and component styling.
- Add route-specific metadata for every new page.
- Verify patient signup/login, doctor pending flow, role redirects, admin approval, logout, responsive layout, and database security checks.

## Technical details
- Authentication uses Lovable Cloud email/password auth; email auto-confirm will be enabled because patients must be able to sign in immediately.
- Protected server functions use the existing authenticated middleware and bearer-token attachment.
- Account creation is performed by a server function that validates all fields, permits only doctor/patient public roles, creates the auth account, uploads/associates the photo safely, and rolls back incomplete registrations where practical.
- Role authorization is enforced in both route guards and backend/database policies; UI guards are not treated as the security boundary.

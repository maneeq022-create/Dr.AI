# Firebase Security Specification - Dr. AI

## Data Invariants
1. A user can only read and write their own profile document.
2. A user can only read and write messages in their own subcollection.
3. Users cannot modify their `email` or `uid` after creation.
4. Messages must have a valid `role` and `mode`.
5. Timestamps must be handled serverside or validated against `request.time`.

## The "Dirty Dozen" Payloads (Attack Vectors)
1. **Identity Spoofing**: Attempt to write to `/users/another-user-id`.
2. **Path Poisoning**: Attempt to use `../` or long junk strings in a document ID.
3. **Ghost Field Injection**: Adding `isAdmin: true` to a user profile.
4. **Message Hijacking**: Trying to read `/users/victim-id/messages/msg-123`.
5. **Orphaned Message**: Creating a message for a user that doesn't exist.
6. **Role Escalation**: Setting `role: 'admin'` (if it existed) or spoofing `model` role as a user.
7. **Type Bomb**: Sending a 1MB string into the `mode` field.
8. **Time Travel**: Setting a future `timestamp`.
9. **Email Spoofing**: Changing email to match an admin's email.
10. **Schema Break**: Sending a message without `text` or `timestamp`.
11. **Metadata Poisoning**: Injecting malicious URLs into `groundingMetadata`.
12. **Unauthenticated Write**: Attempting to create a user profile without being signed in.

## Test Runner (Mock)
- `test('prevent spoofing')`: Expect `set(/users/victim)` by `attacker` to fail.
- `test('prevent message read')`: Expect `get(/users/victim/messages/1)` by `attacker` to fail.
- `test('validate message')`: Expect `set(invalid_msg)` to fail.

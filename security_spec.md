# Security Specification & Threat Model

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. **Diagram Ownership Invariant**: Diagrams at `/users/{userId}/diagrams/{diagramId}` must have `userId == request.auth.uid`, strictly preventing impersonation or orphaned records.
3. **Temporal Invariant**: `createdAt` is immutable once written. `updatedAt` must always match `request.time`.
4. **Volume Boundaries**: Diagram nodes and edges arrays cannot exceed 500 entries; string titles cannot exceed 100 characters; descriptions cannot exceed 500 characters.

## 2. The Dirty Dozen Payloads
1. **Ghost Field Attack**: Inject `{ isProUser: true }` into `/users/{userId}`. (Blocked: `keys().hasOnly()`)
2. **User ID Spoofing**: User `attacker` attempts to write `{ userId: "victim" }` into diagrams. (Blocked: `data.userId == request.auth.uid`)
3. **Cross-Tenant Read**: User `attacker` tries to `get` `/users/{victim}`. (Blocked: `isOwner(userId)`)
4. **List Scraping**: Unauthenticated or non-owner attempts to `list` `/users/{victim}/diagrams`. (Blocked: `isOwner(userId) && resource.data.userId == request.auth.uid`)
5. **Path ID Poisoning**: Attempt to create document with 2KB special character ID. (Blocked: `isValidId(diagramId)`)
6. **Denial of Wallet (Huge String)**: Diagram title with 50,000 characters. (Blocked: `title.size() <= 100`)
7. **Array Flooding**: Attempt to send 10,000 nodes in diagram payload. (Blocked: `nodes.size() <= 500`)
8. **Immutable Field Tamper**: Updating an existing diagram with a changed `createdAt` timestamp. (Blocked: `incoming().createdAt == existing().createdAt`)
9. **Ownership Stealing on Update**: Modifying `userId` of an existing diagram to transfer ownership. (Blocked: `incoming().userId == existing().userId`)
10. **Unauthenticated Write**: Creating a diagram without being signed in. (Blocked: `isSignedIn()`)
11. **Client Clock Tampering**: Setting client-side `updatedAt: "2099-01-01"`. (Blocked: `incoming().updatedAt == request.time`)
12. **Malicious Subcollection Write**: Attempt to write directly to undeclared subcollection `/users/{userId}/secrets`. (Blocked: Global default-deny)

# P0.3 Regression Test Matrix: Collection Authorization Boundaries

## 1. Roles and Personas
- **Anonymous:** Unauthenticated user (no session).
- **Owner:** Authenticated user who created the collection.
- **Non-Owner:** Authenticated user who did NOT create the collection.

## 2. Access Matrix
| Actor                   | Public Collection | Private Owner Collection | Private Non-Owner Collection |
|-------------------------|-------------------|--------------------------|------------------------------|
| **Anonymous**           | Can view          | Not found (404 UI)       | Not found (404 UI)           |
| **Owner**               | Can view/manage   | Can view/manage          | N/A                          |
| **Authenticated User**  | Can view          | Not found (404 UI)       | Not found (404 UI)           |

## 3. Test Cases

### TC1: Anonymous Access
- **Action:** Anonymous user visits `/collections/[public-slug]`
- **Expected:** Sees collection details and items. Cannot see edit/delete controls.
- **Action:** Anonymous user visits `/collections/[private-slug]`
- **Expected:** Sees generic "Collection Not Found" UI. No redirect.

### TC2: Owner Access
- **Action:** Owner visits `/collections/[public-slug]`
- **Expected:** Sees collection details, items, and edit/delete controls.
- **Action:** Owner visits `/collections/[private-slug]`
- **Expected:** Sees collection details, items, edit/delete controls, and "Private Collection" badge.

### TC3: Non-Owner Access
- **Action:** Non-owner visits `/collections/[public-slug]`
- **Expected:** Sees collection details and items. Cannot see edit/delete controls.
- **Action:** Non-owner visits `/collections/[private-slug]`
- **Expected:** Sees generic "Collection Not Found" UI. No redirect.

### TC4: Mutation Enforcement (UI & API)
- **Action:** Owner toggles privacy via `CollectionActions`.
- **Expected:** Success, UI updates instantly.
- **Action:** Owner deletes collection via `CollectionActions`.
- **Expected:** Success, redirected to `/my-collections`.
- **Action:** Malicious Non-Owner attempts to send `update` or `delete` request to Supabase API for a collection they don't own.
- **Expected:** Request fails due to RLS policies (`auth.uid() = user_id`). UI surfaces error if attempted via client.

### TC5: Item Visibility Match
- **Action:** User (any role) views a collection they have access to.
- **Expected:** Only items associated with that collection are visible.
- **Action:** Malicious user attempts to read `collection_items` for a private collection they don't own via API.
- **Expected:** Request returns `[]` due to RLS `EXISTS(SELECT 1 FROM collections WHERE id = collection_id AND (is_private = false OR user_id = auth.uid()))`.

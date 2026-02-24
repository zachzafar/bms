# Public API Reference

> All endpoints listed here require **no authentication**. They are decorated with `@Public()` in the NestJS controllers and are designed for customer-facing or tenant-registration flows.
>
> Base URL (local dev): `http://localhost:3001`
>
> Authenticated endpoints (requiring `Authorization: Bearer <token>` and `x-tenant-id` headers) are **not** listed here.

---

## Table of Contents

1. [Assets](#1-assets)
2. [Asset Types](#2-asset-types)
3. [Bookings](#3-bookings)
4. [Authentication](#4-authentication)
5. [Tenant](#5-tenant)
6. [Taxes & Fees](#6-taxes--fees)
7. [Add-ons](#7-add-ons)
8. [Tags](#8-tags)
9. [Forms](#9-forms)
10. [Rates](#10-rates)
11. [Blocked Dates](#11-blocked-dates)

---

## 1. Assets

### GET `/asset-details`

Returns all assets with images and properties for authenticated tenant context (internal public listing).

**Query Params**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `assetTypes` | `number[]` | No | Filter by asset type IDs |
| `page` | `number` | No | Page number (default: 1) |
| `pageSize` | `number` | No | Items per page |

**Response 200**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "images": ["string (URL)"],
      "properties": [
        { "id": 1, "name": "string", "value": "string" }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### GET `/assets-by-sub/:subdomain`

Returns a paginated list of assets for a specific tenant identified by subdomain. Used on the customer listing page.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant's subdomain |

**Query Params**
| Param | Type | Required |
|-------|------|----------|
| `page` | `number` | No |
| `pageSize` | `number` | No |

**Response 200**
```json
{
  "data": [
    {
      "id": "string",
      "slug": "string | null",
      "name": "string",
      "description": "string",
      "images": ["string (URL)"],
      "properties": [
        { "id": 1, "name": "string", "value": "string" }
      ]
    }
  ]
}
```

> **Note:** Use `slug` for asset detail links if present, falling back to `id`. Links should go to `/assets-by-sub/:subdomain/:slug`.

---

### GET `/assets-by-sub/:subdomain/:slug`

Returns complete details for a single asset. Accepts either a slug or an asset ID (backward compatibility).

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant's subdomain |
| `slug` | `string` | Asset slug or asset ID |

**Response 200**
```json
{
  "id": "string",
  "slug": "string | null",
  "name": "string",
  "description": "string | null",
  "tenantId": "string",
  "assetTypeId": "number | null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date | null",
  "images": [
    {
      "id": 1,
      "assetId": "string",
      "filePath": "string",
      "imageType": "primary | secondary | gallery"
    }
  ],
  "properties": [
    {
      "id": 1,
      "assetId": "string",
      "value": "string",
      "assetPropertyId": 1,
      "assetProperty": {
        "id": 1,
        "name": "string",
        "propertyType": "string"
      }
    }
  ],
  "location": {
    "id": 1,
    "assetId": "string",
    "address": "string | null",
    "lat": "string | null",
    "lng": "string | null"
  }
}
```

**Response 404** — asset not found

> **Note:** `lat` and `lng` are stored as decimal strings from the database. Parse to float on the frontend when rendering on a map.

---

## 2. Asset Types

### GET `/customer/:subdomain/assetTypes`

Returns paginated asset types for a tenant. Used on the customer browse page when `booksByTagOnCustomerPage` is enabled on the tenant.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant's subdomain |

**Query Params**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | `string` | No | Search by name |
| `assetId` | `string` | No | Filter by associated asset |
| `page` | `number` | No | |
| `pageSize` | `number` | No | |

**Response 200**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "string | null",
      "name": "string",
      "image": "string | null",
      "description": "string | null"
    }
  ],
  "pagination": { ... }
}
```

> **Note:** Use `slug ?? id` when building links to `/customer/:subdomain/tag/:slug`.

---

### GET `/customer/:subdomain/assetType/:id`

Returns full details for a single asset type, including its property values. Accepts either a numeric ID or a slug.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant's subdomain |
| `id` | `string` | Asset type slug or numeric ID |

**Response 200**
```json
{
  "id": 1,
  "name": "string",
  "image": "string | null",
  "description": "string | null",
  "propertyValues": [
    {
      "id": 1,
      "assetTypeId": 1,
      "assetPropertyId": 1,
      "value": "string",
      "property": {
        "name": "string",
        "propertyType": "string"
      }
    }
  ]
}
```

**Response 404** — asset type not found

---

## 3. Bookings

### POST `/customer-create-booking/:tenantId`

Creates a booking for a specific asset. Used when a customer selects a concrete asset.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `tenantId` | `string` | Tenant ID (UUID) |

**Request Body**
```json
{
  "booking": {
    "assetId": "string",
    "startDate": "ISO date",
    "endDate": "ISO date",
    "notes": "string (optional)"
  },
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string (optional)"
  },
  "formResponses": [
    { "formFieldId": 1, "value": "string" }
  ],
  "addons": [
    { "addonItemId": 1, "quantity": 1 }
  ]
}
```

**Response 201**
```json
{ "message": "string" }
```

---

### POST `/customer-create-booking-by-asset-type/:tenantId`

Creates a booking by asset type. The server auto-assigns the best available asset for the requested date range.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `tenantId` | `string` | Tenant ID (UUID) |

**Request Body**
```json
{
  "assetTypeId": 1,
  "startDate": "ISO date",
  "endDate": "ISO date",
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string (optional)"
  },
  "formResponses": [
    { "formFieldId": 1, "value": "string" }
  ],
  "addons": [
    { "addonItemId": 1, "quantity": 1 }
  ]
}
```

**Response 201**
```json
{ "message": "string", "assetName": "string" }
```

**Response 404**
```json
{ "message": "No available asset found for the requested dates" }
```

---

### GET `/customer-view-booking/:bookingId/:token`

Returns full booking details. Used on the customer booking confirmation / management page. Requires the unique token sent in the confirmation email.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `bookingId` | `string` | Booking ID |
| `token` | `string` | Booking management token (from email) |

**Response 200** — Full booking object (ExtendedSelectBookingSchema)

**Response 403** — Invalid or mismatched token

---

### PUT `/update-booking-by-token/:token/:bookingId`

Updates an existing booking using the management token. Allows customers to change dates/notes without logging in.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `token` | `string` | Booking management token |
| `bookingId` | `string` | Booking ID |

**Request Body** — Partial booking update fields (UpdateBookingSchema)

**Response 200**
```json
{ "message": "string" }
```

**Response 403** — Invalid token

---

### POST `/cancel-booking-by-token/:token/:bookingId`

Cancels a booking using the management token.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `token` | `string` | Booking management token |
| `bookingId` | `string` | Booking ID |

**Request Body** — `{}`

**Response 200**
```json
{ "message": "string" }
```

**Response 403** — Invalid token

---

## 4. Authentication

### POST `/login`

Authenticates a user and returns access + refresh tokens.

**Request Body**
```json
{ "email": "string", "password": "string" }
```

**Response 200**
```json
{
  "token": "string (JWT)",
  "refreshToken": "string",
  "user": { /* user fields minus password */ },
  "tenants": [ /* SelectTenantSchema[] */ ]
}
```

---

### POST `/refresh`

Exchanges a refresh token for a new access token.

**Request Body**
```json
{ "refresh": "string" }
```

**Response 201**
```json
{
  "token": "string",
  "refreshToken": "string",
  "user": { /* user fields */ }
}
```

---

### POST `/tenant`

Registers a new tenant with an initial admin user. Used during onboarding.

**Request Body**
```json
{
  "tenant": { /* InsertTenantSchema */ },
  "adminUser": { /* InsertUserSchema */ }
}
```

**Response 201**
```json
{ "tenantId": "string", "userId": "string" }
```

---

### POST `/password-reset`

Sends a password reset email to the given address.

**Request Body**
```json
{ "email": "string" }
```

**Response 200**
```json
{ "message": "string" }
```

---

### POST `/password-reset/confirm`

Completes the password reset flow using the token from the reset email.

**Request Body**
```json
{ "token": "string", "password": "string" }
```

**Response 200**
```json
{ "message": "string" }
```

---

### POST `/admin`

Registers a new admin (super-admin) user.

**Request Body**
```json
{ "name": "string", "email": "string" }
```

**Response 201**
```json
{ "userId": "string", "email": "string", "message": "string" }
```

---

### POST `/admin/validate`

Validates an admin registration token (from email).

**Request Body**
```json
{ "token": "string" }
```

**Response 200**
```json
{ "isAdmin": true, "valid": true }
```

---

### GET `/me/permissions`

Returns the current user's permission strings for their tenant. Although public (no auth guard), it reads from the JWT if present.

**Headers**
| Header | Description |
|--------|-------------|
| `x-tenant-id` | Tenant ID to scope permissions |

**Response 200** — `string[]`

---

## 5. Tenant

### GET `/tenant/:subdomain`

Returns public tenant metadata by subdomain. Called at customer page load to get branding/settings.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant subdomain |

**Response 200**
```json
{
  "id": "string",
  "name": "string",
  "subdomain": "string",
  "enableAutomaticConfirmation": true,
  "booksByTagOnCustomerPage": false,
  "logoUrl": "string | null",
  "backgroundImage": "string | null"
}
```

**Response 404**
```json
{ "message": "Tenant not found" }
```

> **Note:** `booksByTagOnCustomerPage` determines whether the customer landing page shows asset types (tags) or individual assets.

---

## 6. Taxes & Fees

### GET `/tax-fees-by-sub/:subdomain`

Returns all active taxes and fees for a tenant. Used in the customer checkout to display and apply charges.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant subdomain |

**Response 200** — `SelectTaxFeeSchema[]`

Each object contains: `id`, `name`, `type` (`percentage` | `flat`), `value`, `tenantId`.

---

## 7. Add-ons

### GET `/addons-by-sub/:subdomain`

Returns active add-on items for a tenant. Used in the customer booking flow.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant subdomain |

**Response 200** — `SelectAddonItemSchema[]`

Each object contains: `id`, `name`, `description`, `price`, `currency`, `maxQuantity`, `tenantId`.

---

## 8. Tags

### GET `/tags-by-sub/:subdomain`

Returns paginated tags (asset groupings) for a tenant. Used on the customer landing page as a category browser.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant subdomain |

**Query Params**
| Param | Type | Required |
|-------|------|----------|
| `page` | `number` | No |
| `pageSize` | `number` | No |

**Response 200**
```json
{
  "data": [
    {
      "id": 1,
      "name": "string",
      "description": "string | null",
      "tagImage": "string | null"
    }
  ],
  "pagination": { ... }
}
```

**Response 404**
```json
{ "message": "string" }
```

---

## 9. Forms

### GET `/form/public/asset/:assetId`

Returns all booking forms assigned to a specific asset (directly or via asset type / tag). Used on the customer asset booking page to render dynamic form fields.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `assetId` | `string` | Asset ID |

**Response 200**
```json
{
  "forms": [
    {
      "form": { /* SelectBookingFormSchema */ },
      "fields": [ /* SelectBookingFormFieldSchema[] */ ],
      "assignmentType": "direct | assetType | tag"
    }
  ]
}
```

---

### GET `/form/public/asset-type/:assetTypeId`

Returns booking forms assigned to an asset type. Used on the customer asset-type booking page.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `assetTypeId` | `number` | Asset type ID |

**Response 200**
```json
{
  "forms": [
    {
      "form": { /* SelectBookingFormSchema */ },
      "fields": [ /* SelectBookingFormFieldSchema[] */ ]
    }
  ]
}
```

---

## 10. Rates

### GET `/rates-by-sub/:subdomain`

Returns paginated rates for a tenant. Optionally filtered by asset or asset type. Used for customer pricing display.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant subdomain |

**Query Params**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `assetId` | `string` | No | Filter rates for a specific asset |
| `assetTypeId` | `number` | No | Filter rates for a specific asset type |
| `page` | `number` | No | |
| `pageSize` | `number` | No | |

**Response 200**
```json
{
  "data": [
    {
      "rate": { /* SelectRateSchema */ },
      "assetIds": ["string"],
      "assetTypeIds": [1]
    }
  ],
  "pagination": { ... }
}
```

**Response 404**
```json
{ "message": "string" }
```

---

### GET `/rates-by-sub/:subdomain/:id`

Returns a single rate by ID.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `subdomain` | `string` | Tenant subdomain |
| `id` | `number` | Rate ID |

**Response 200** — `SelectRateSchema`

**Response 404**
```json
{ "message": "string" }
```

---

## 11. Blocked Dates

### GET `/public/blocked-dates/:assetId`

Returns all blocked date ranges for a specific asset. Used by the customer booking calendar to disable unavailable dates.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `assetId` | `string` | Asset ID |

**Response 200**
```json
[
  { "startDate": "ISO date", "endDate": "ISO date" }
]
```

---

### GET `/public/blocked-dates/assetType/:assetTypeId`

Returns fully blocked date ranges for an asset type (dates where **all** assets of the type are booked). Used on the asset-type booking calendar.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `assetTypeId` | `number` | Asset type ID |

**Query Params**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | `date` | No | Range start for query window |
| `endDate` | `date` | No | Range end for query window |

**Response 200**
```json
[
  { "start": "ISO date", "end": "ISO date" }
]
```

---

## Customer Booking Flow (Summary)

This is the typical sequence for a customer booking on a subdomain page:

```
1. GET /tenant/:subdomain                          → get tenant config
2a. GET /customer/:subdomain/assetTypes            → list categories (if booksByTagOnCustomerPage)
2b. GET /assets-by-sub/:subdomain                  → list assets (if !booksByTagOnCustomerPage)

3. Customer selects an item, navigates to detail page:
   GET /assets-by-sub/:subdomain/:slug             → asset details + location
   GET /customer/:subdomain/assetType/:id          → asset type details

4. Customer opens booking form:
   GET /form/public/asset/:assetId                 → booking form fields
   GET /form/public/asset-type/:assetTypeId        → booking form fields (by type)
   GET /public/blocked-dates/:assetId              → calendar blocked dates
   GET /public/blocked-dates/assetType/:id         → calendar blocked dates (by type)
   GET /rates-by-sub/:subdomain                    → pricing
   GET /tax-fees-by-sub/:subdomain                 → taxes/fees
   GET /addons-by-sub/:subdomain                   → optional add-ons

5. Customer submits booking:
   POST /customer-create-booking/:tenantId         → book specific asset
   POST /customer-create-booking-by-asset-type/:tenantId  → book by category

6. Confirmation / management:
   GET /customer-view-booking/:bookingId/:token    → view booking
   PUT /update-booking-by-token/:token/:bookingId  → modify booking
   POST /cancel-booking-by-token/:token/:bookingId → cancel booking
```

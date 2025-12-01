# Architecture Overview

This document provides a comprehensive overview of the Salesforce API Test Bench architecture, including system design, components, API endpoints, database schema, and UI features.

## Table of Contents

- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Core Modules](#core-modules)
- [UI Components](#ui-components)
- [Authentication & Security](#authentication--security)
- [Test Scenarios](#test-scenarios)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Next.js)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Dashboard │ │Environments│ │  Tests   │ │ Results  │ │Reports ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │/api/       │ │/api/       │ │/api/       │ │/api/       │   │
│  │environments│ │credentials │ │tests       │ │results     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Business Logic                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │Salesforce  │ │Test Engine │ │Verification│ │PDF         │   │
│  │Client      │ │Runner      │ │Engine      │ │Generator   │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   SQLite/        │ │  Salesforce  │ │  Vercel Blob     │
│   PostgreSQL     │ │  REST API    │ │  Storage         │
│   (Database)     │ │  (External)  │ │  (PDF Storage)   │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Next.js 15 | UI framework with App Router |
| **Styling** | Tailwind CSS, Shadcn/ui | Component styling and design system |
| **State** | React Hooks | Client-side state management |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **Database** | Prisma ORM | Type-safe database access |
| **DB Engine** | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| **HTTP Client** | Axios | External API requests |
| **Validation** | Zod | Runtime schema validation |
| **PDF** | PDFKit | Report generation |
| **Storage** | Vercel Blob / Local filesystem | PDF file storage |
| **Auth** | OAuth2, API Key | Salesforce authentication |

---

## Directory Structure

```
fantastic-octo/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (19 endpoints)
│   │   ├── auth/                 # OAuth authentication
│   │   │   └── salesforce/       # Salesforce OAuth flow
│   │   ├── environments/         # Environment CRUD
│   │   │   └── [id]/             # Single environment operations
│   │   ├── credentials/          # Credential CRUD
│   │   │   └── [id]/             # Single credential operations
│   │   ├── tests/                # Test CRUD & execution
│   │   │   └── [id]/
│   │   │       └── execute/      # Test execution endpoint
│   │   ├── results/              # Test results CRUD
│   │   │   └── [id]/
│   │   │       └── manual-status/# Manual status override
│   │   ├── test-results/         # Advanced result queries
│   │   │   ├── added-tenants/    # Tenant addition results
│   │   │   ├── available-dans/   # Available DAN numbers
│   │   │   └── successful-creations/
│   │   └── reports/              # PDF report generation
│   │       └── generate/
│   ├── environments/             # Environment management page
│   ├── tests/                    # Test management pages
│   │   └── [endpointId]/         # Endpoint-specific test dashboard
│   ├── results/                  # Results viewer page
│   ├── reports/                  # Reports page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Dashboard/home page
│   └── globals.css               # Global styles & CSS variables
│
├── components/                   # React Components
│   ├── ui/                       # Shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── navigation.tsx            # Main navigation bar
│   ├── theme-provider.tsx        # Dark/light theme provider
│   ├── theme-toggle.tsx          # Theme toggle button
│   ├── environment-dialog.tsx    # Environment add/edit modal
│   ├── credential-dialog.tsx     # Credential add/edit modal
│   ├── test-dialog.tsx           # Test configuration modal
│   └── custom-test-dialog.tsx    # Custom API test modal
│
├── lib/                          # Core Business Logic
│   ├── db/
│   │   └── prisma.ts             # Prisma client singleton
│   ├── salesforce/               # Salesforce integration
│   │   ├── auth.ts               # OAuth authentication
│   │   ├── oauth.ts              # Token management
│   │   ├── rest-client.ts        # Generic REST client
│   │   ├── ewc-client.ts         # EWC-specific client
│   │   ├── region-scheme.ts      # Region/scheme mapping
│   │   └── verification-client.ts# Result verification
│   ├── test-engine/              # Test execution
│   │   ├── runner.ts             # Test runner
│   │   └── validator.ts          # Response validator
│   ├── test-scenarios/           # Pre-built scenarios (22 files)
│   │   ├── deposit-creation-scenarios.ts
│   │   ├── deposit-update-scenarios.ts
│   │   ├── add-to-cart-scenarios.ts
│   │   ├── remove-tenant-scenarios.ts
│   │   └── ...
│   ├── verification/             # Verification engine
│   │   ├── engine.ts
│   │   └── config.ts
│   ├── pdf/                      # PDF generation
│   ├── api-endpoints.ts          # API endpoint definitions
│   ├── test-data-generator.ts    # Test data generation
│   └── utils.ts                  # Utility functions
│
├── hooks/                        # React Custom Hooks
│   └── use-toast.ts              # Toast notifications
│
├── types/                        # TypeScript Definitions
│   ├── test.ts                   # Test types with Zod schemas
│   ├── credential.ts             # Credential types
│   ├── environment.ts            # Environment types
│   ├── salesforce.ts             # Salesforce API types
│   └── testResult.ts             # Test result types
│
├── prisma/                       # Database
│   └── schema.prisma             # Prisma schema definition
│
├── public/                       # Static assets
├── scripts/                      # Utility scripts
│
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── postcss.config.js
    ├── components.json           # Shadcn/ui config
    └── .env.example
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   Environment   │       │   Credential    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │
│ name            │   │   │ authType        │
│ type            │   │   │ orgName         │
│ instanceUrl     │   │   │ regionScheme    │
│ description     │   │   │ memberId        │
│ active          │   │   │ branchId        │
│ verification*   │   └───│ environmentId(FK)│
│ sfConnectedApp* │       │ apiKey (enc)    │
│ createdAt       │       │ clientId        │
│ updatedAt       │       │ clientSecret(enc)│
└────────┬────────┘       │ active          │
         │                └────────┬────────┘
         │                         │
         │    ┌────────────────────┘
         │    │
         ▼    ▼
┌─────────────────┐       ┌─────────────────┐
│      Test       │       │   TestResult    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ id (PK)         │
│ name            │       │ testId (FK)     │
│ description     │       │ credentialId(FK)│
│ endpoint        │       │ status          │
│ method          │       │ manualStatus    │
│ headers (JSON)  │       │ responseTime    │
│ body (JSON)     │       │ statusCode      │
│ expectedStatus  │       │ request (JSON)  │
│ validations(JSON)│      │ response (JSON) │
│ useAliasUrl     │       │ validationResults│
│ environmentId(FK)│      │ error           │
│ credentialId(FK)│       │ notes           │
│ createdAt       │       │ verification*   │
│ updatedAt       │       │ executedAt      │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│   TestReport    │
├─────────────────┤
│ id (PK)         │
│ title           │
│ description     │
│ groupingType    │
│ groupingValue   │
│ resultIds (JSON)│
│ totalTests      │
│ passedTests     │
│ failedTests     │
│ errorTests      │
│ avgResponseTime │
│ pdfPath         │
│ generatedAt     │
│ generatedBy     │
└─────────────────┘
```

### Model Details

#### Environment
Stores Salesforce org configurations.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| name | String | Unique environment name |
| type | String | "production", "sandbox", "scratch" |
| instanceUrl | String | Salesforce instance URL |
| active | Boolean | Environment enabled/disabled |
| verificationEnabled | Boolean | Enable result verification |
| verificationBearerToken | String? | Token for verification queries |

#### Credential
Authentication credentials for Salesforce APIs.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| authType | String | "apikey" or "oauth2" |
| orgName | String | Organization name |
| regionScheme | String | "EW - Custodial", "EW - Insured", etc. |
| memberId | String | Member ID |
| branchId | String | Branch ID |
| apiKey | String? | Encrypted API key |
| clientId | String? | OAuth client ID |
| clientSecret | String? | Encrypted client secret |

#### Test
API test configuration.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| name | String | Test name |
| endpoint | String | API endpoint path |
| method | String | HTTP method |
| headers | String? | JSON headers |
| body | String? | JSON request body |
| expectedStatus | Int | Expected HTTP status |
| validations | String? | JSON validation rules |
| useAliasUrl | Boolean | Use legacy alias URL |

#### TestResult
Test execution results.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| status | String | "passed", "failed", "error" |
| manualStatus | String? | Manual override status |
| responseTime | Int | Response time (ms) |
| statusCode | Int | HTTP status code |
| request | String | JSON request details |
| response | String | JSON response data |
| validationResults | String? | JSON validation outcomes |
| verificationPassed | Boolean? | Verification result |

---

## API Endpoints

### Environments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/environments` | List all environments |
| POST | `/api/environments` | Create environment |
| GET | `/api/environments/[id]` | Get environment details |
| PUT | `/api/environments/[id]` | Update environment |
| DELETE | `/api/environments/[id]` | Delete environment |

### Credentials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credentials` | List all credentials |
| POST | `/api/credentials` | Create credential |
| GET | `/api/credentials/[id]` | Get credential details |
| PUT | `/api/credentials/[id]` | Update credential |
| DELETE | `/api/credentials/[id]` | Delete credential |

### Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests` | List all tests |
| POST | `/api/tests` | Create test |
| GET | `/api/tests/[id]` | Get test details |
| PUT | `/api/tests/[id]` | Update test |
| DELETE | `/api/tests/[id]` | Delete test |
| POST | `/api/tests/[id]/execute` | Execute test |

### Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/results` | List test results |
| POST | `/api/results` | Create result |
| GET | `/api/results/[id]` | Get result details |
| PUT | `/api/results/[id]` | Update result |
| DELETE | `/api/results/[id]` | Delete result |
| PUT | `/api/results/[id]/manual-status` | Override status |

### Test Results (Advanced)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test-results` | Query results with filters |
| GET | `/api/test-results/added-tenants` | Get tenant addition results |
| GET | `/api/test-results/available-dans` | Get available DAN numbers |
| GET | `/api/test-results/successful-creations` | Get successful creations |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List generated reports |
| POST | `/api/reports/generate` | Generate PDF report |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/salesforce/authorize` | Initiate OAuth flow |
| GET | `/api/auth/salesforce/callback` | OAuth callback |
| POST | `/api/auth/salesforce/refresh` | Refresh tokens |

---

## Core Modules

### Test Engine (`lib/test-engine/`)

#### Runner (`runner.ts`)
Executes API tests against Salesforce endpoints.

```typescript
interface TestExecutionContext {
  test: Test
  instanceUrl: string
  credential?: EWCCredentials
  fixedApiKey?: { header: string; value: string }
}

async function executeTest(context: TestExecutionContext): Promise<TestExecutionResult>
```

**Features:**
- Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Automatic OAuth2 token refresh
- API key token building
- Alias URL support for legacy endpoints
- Response time measurement

#### Validator (`validator.ts`)
Validates API responses against defined rules.

```typescript
type ValidationCondition = 'equals' | 'contains' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan'

interface ValidationRule {
  field: string      // JSON path (dot notation)
  condition: ValidationCondition
  value?: any
}

function validateResponse(responseData: any, validations: ValidationRule[]): ValidationResult[]
```

### Salesforce Client (`lib/salesforce/`)

#### EWC Client (`ewc-client.ts`)
Specialized client for EWC (Energy Wise Custodian) APIs.

**Features:**
- API Key authentication with region/scheme token building
- OAuth2 authentication with automatic token refresh
- Endpoint transformation for OAuth2 (`/auth/` prefix)
- Error handling with structured responses

#### Region Scheme (`region-scheme.ts`)
Maps region/scheme classifications to API tokens.

| Classification | Token Format |
|---------------|--------------|
| EW - Custodial | EWCS |
| EW - Insured | EWIS |
| NI - Custodial | NICS |
| NI - Insured | NIIS |
| SDS - Custodial | SDCS |

### Verification Engine (`lib/verification/`)

Post-execution verification against Salesforce database.

**Features:**
- Query Salesforce to verify API changes
- Compare response data with database records
- Extensible verification rules per endpoint

---

## UI Components

### Theme System

The application supports light and dark themes using `next-themes`.

#### Theme Provider (`components/theme-provider.tsx`)
Wraps the application with theme context.

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

#### Theme Toggle (`components/theme-toggle.tsx`)
Button to switch between light/dark modes.

- Sun icon for light mode
- Moon icon for dark mode
- Persists preference in localStorage

### Navigation (`components/navigation.tsx`)

Main navigation bar with:
- Application title/logo
- Navigation links (Dashboard, Environments, Tests, Results, Reports)
- Theme toggle button
- Responsive design

### API Endpoints Page (`app/tests/page.tsx`)

#### Features
- **Search**: Filter endpoints by name, description, or path
- **Grouping**: Endpoints grouped by section (NRLA, Deposit Management)
- **Method Grouping**: Within sections, grouped by HTTP method
- **View Toggle**: Switch between Grid and List views

#### Method Color Coding

| Method | Color | Icon |
|--------|-------|------|
| GET | Blue (`blue-600`) | Download |
| POST | Green (`emerald-600`) | Upload |
| PUT | Amber (`amber-500`) | RefreshCw |
| PATCH | Purple (`purple-600`) | Pencil |
| DELETE | Red (`red-600`) | Trash2 |

#### Card Features (Grid View)
- Colored left border indicating HTTP method
- Method icon in colored badge
- Method and category badges
- Endpoint path in monospace
- Path parameter indicator (amber dot)
- Hover effects: scale, glow, arrow animation

#### List View
- Compact single-row layout
- Method icon, name, category, endpoint path
- Hover effects with chevron animation

### Dark Mode Optimizations

CSS variables optimized for dark mode contrast:

| Variable | Light | Dark |
|----------|-------|------|
| `--card` | 100% lightness | 11% lightness |
| `--muted-foreground` | 46.9% lightness | 75% lightness |
| `--border` | 91.4% lightness | 25% lightness |

---

## Authentication & Security

### Credential Encryption

Sensitive credentials are encrypted using AES-256-CBC:

```typescript
const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32-byte hex string

function encrypt(text: string): string
function decrypt(text: string): string
```

**Encrypted fields:**
- `apiKey` in Credential model
- `clientSecret` in Credential model
- `sfConnectedAppClientSecret` in Environment model

### Authentication Methods

#### API Key Authentication
Token format: `{scheme}{memberId}{branchId}{apiKey}`

Example: `EWCS123456789ABC123apikey123`

#### OAuth2 Authentication
- Client credentials flow
- Automatic token refresh via Axios interceptors
- Token expiry tracking

### Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **Encryption Key**: Use secure random key in production
3. **HTTPS**: Required for cloud deployments
4. **Connected App**: Restrict access in Salesforce

---

## Test Scenarios

22 pre-built test scenarios covering:

### Deposit Management
- Deposit Creation
- Deposit Update
- Deposit Status
- Delete Deposit

### Tenant Management
- Add Additional Tenant
- Remove Tenant
- Transfer Deposit

### Cart Operations
- Add to Cart
- Remove from Cart
- List Cart Contents

### Landlord & Property
- Register Landlord
- Search Landlord
- Search Property

### Other Operations
- Branch List
- Repayment Request/Response
- Dispute Status
- DPC Certificate

---

## Configuration Files

### `tailwind.config.ts`
- Dark mode: `class` strategy
- Custom color variables (CSS custom properties)
- Extended animations for accordion

### `next.config.js`
- Server actions enabled (2MB body limit)
- Webpack externalization for PDFKit

### `components.json`
- Shadcn/ui configuration
- Component aliases and style settings

---

## Deployment

### Local Development
```bash
npm install
npm run db:push
npm run dev
```

### Production (Vercel)
1. Create Vercel Postgres database
2. Create Vercel Blob storage
3. Set environment variables
4. Deploy from GitHub

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `ENCRYPTION_KEY` | Yes | 32-byte hex encryption key |
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL |
| `BLOB_READ_WRITE_TOKEN` | Prod | Vercel Blob token |

---

## Version History

- **Initial Release**: Core test bench functionality
- **UI Enhancement**: Theme toggle, card improvements, view modes
- **Dark Mode Fix**: Improved contrast and readability

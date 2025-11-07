# Salesforce API Test Bench

A local web application for testing and validating Salesforce API endpoints across multiple environments. Built with Next.js, TypeScript, Prisma, and Puppeteer.

## Features

- **Environment Management**: Configure multiple Salesforce environments (Production, Sandbox, Scratch Orgs)
- **Test Creation**: Build API tests with custom headers, body, and validation rules
- **Test Execution**: Run tests against any configured environment
- **Response Validation**: Validate response data with flexible rules (equals, contains, exists, etc.)
- **PDF Reports**: Generate professional PDF reports for test results
- **Test History**: Track all test executions with detailed results
- **Secure Credentials**: Encrypted storage of Salesforce credentials

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (local) / PostgreSQL (cloud)
- **ORM**: Prisma
- **UI**: Tailwind CSS + Shadcn/ui
- **PDF Generation**: Puppeteer
- **HTTP Client**: Axios
- **Validation**: Zod

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "EWC API Test Bench"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Important**: Change the `ENCRYPTION_KEY` in production to a secure random string:

```bash
openssl rand -hex 32
```

### 4. Initialize the database

```bash
npm run db:generate
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Add an Environment

1. Navigate to **Environments** page
2. Click "Add Environment"
3. Fill in the form:
   - **Name**: Descriptive name (e.g., "Production", "Sandbox")
   - **Type**: production, sandbox, or scratch
   - **Instance URL**: Your Salesforce instance URL (e.g., `https://your-domain.my.salesforce.com`)
   - **Client ID**: From your Salesforce Connected App
   - **Client Secret**: From your Salesforce Connected App
   - **Username** (optional): For username-password flow
4. Click "Save"

### 2. Create a Test

1. Navigate to **Tests** page
2. Click "Create Test"
3. Configure your test:
   - **Name**: Descriptive test name
   - **Description** (optional): Test purpose
   - **Environment**: Select target environment
   - **Method**: GET, POST, PUT, PATCH, DELETE
   - **Endpoint**: API path (e.g., `/services/data/v59.0/sobjects/Account`)
   - **Headers** (optional): Custom headers as JSON
   - **Body** (optional): Request body as JSON
   - **Expected Status**: Expected HTTP status code (default: 200)
   - **Validations** (optional): Response validation rules
4. Click "Save"

### 3. Run a Test

1. Navigate to **Tests** page
2. Click "Run" on any test
3. View the results immediately
4. Optionally generate a PDF report

### 4. Generate PDF Reports

1. Navigate to **Results** page
2. Find the test result you want to export
3. Click "Generate PDF"
4. Download the PDF report

## Validation Rules

You can add validation rules to check response data:

```json
[
  {
    "field": "name",
    "condition": "equals",
    "value": "Expected Name"
  },
  {
    "field": "status",
    "condition": "contains",
    "value": "active"
  },
  {
    "field": "count",
    "condition": "greaterThan",
    "value": 0
  }
]
```

**Supported conditions**:
- `equals`: Exact match
- `contains`: String/array contains value
- `exists`: Field exists in response
- `notExists`: Field does not exist
- `greaterThan`: Numeric comparison
- `lessThan`: Numeric comparison

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (no migration)
npm run db:push

# Create a migration
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Cloud Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (use Vercel Postgres)
   - `ENCRYPTION_KEY`: Secure random string
4. Deploy!

### Azure Web App

1. Create an Azure Web App (Node.js)
2. Create an Azure Database for PostgreSQL
3. Configure environment variables in App Settings
4. Deploy via GitHub Actions or Azure CLI

### Render

1. Create a new Web Service
2. Create a PostgreSQL database
3. Set environment variables
4. Deploy from GitHub

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── environments/  # Environment CRUD
│   │   ├── tests/        # Test CRUD & execution
│   │   └── results/      # Results & PDF generation
│   ├── environments/      # Environment management UI
│   ├── tests/            # Test management UI
│   └── results/          # Results viewer UI
├── components/            # React components
│   └── ui/               # Shadcn components
├── lib/                   # Core business logic
│   ├── db/               # Database client
│   ├── salesforce/       # Salesforce API client
│   ├── test-engine/      # Test execution engine
│   └── pdf/              # PDF generation
├── prisma/               # Database schema & migrations
├── types/                # TypeScript type definitions
└── public/               # Static files & generated PDFs
```

## Salesforce Setup

To use this test bench, you need a Salesforce Connected App:

1. In Salesforce Setup, go to **App Manager**
2. Click **New Connected App**
3. Fill in basic information
4. Enable **OAuth Settings**
5. Add OAuth Scopes: `api`, `refresh_token`, `offline_access`
6. For server-to-server, enable **Client Credentials Flow**
7. Save and retrieve **Client ID** and **Client Secret**

## Security Notes

- **Never commit `.env` file** - it contains sensitive credentials
- **Change `ENCRYPTION_KEY`** in production to a secure random value
- **Use HTTPS** when deploying to cloud
- **Restrict Connected App** access in Salesforce to specific users/profiles
- **Consider** implementing authentication for multi-user deployments

## Troubleshooting

### Prisma Client not found

```bash
npm run db:generate
```

### Database connection issues

Check your `DATABASE_URL` in `.env` file

### Puppeteer issues on Windows

Puppeteer may need additional dependencies. See [Puppeteer troubleshooting](https://pptr.dev/troubleshooting)

### API authentication errors

Verify your Salesforce credentials are correct and the Connected App has the right permissions

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Contributing

This is an internal tool. For issues or feature requests, contact the development team.

## License

Internal use only.

## Support

For questions or issues, contact your development team or create an issue in the repository.

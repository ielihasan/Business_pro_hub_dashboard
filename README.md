# Business Pro Hub

A comprehensive business management platform with an integrated landing page and powerful dashboard featuring real-time queue optimization.

**Company:** Elixa Software Private Limited**Project:** BusinessHub Pro

---

## Table of Contents

-   [Quick Start](#quick-start)
-   [Project Structure](#project-structure)
-   [Contributor Setup Guide](#contributor-setup-guide)
-   [Environment Variables](#environment-variables)
-   [Database Setup](#database-setup)
-   [External Services Configuration](#external-services-configuration)
-   [Application Features](#application-features)
-   [User Roles & Access](#user-roles--access)
-   [Tech Stack](#tech-stack)
-   [API Endpoints](#api-endpoints)
-   [Development Commands](#development-commands)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)

---

## Quick Start

### Prerequisites

-   **Node.js 18+** — [https://nodejs.org](https://nodejs.org)
-   **Java 17 (JDK)** — [https://adoptium.net](https://adoptium.net) (Eclipse Temurin recommended)
-   **Apache Maven 3.9+** — [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi)
-   **Supabase account** (free tier) — [https://supabase.com](https://supabase.com)
-   **Resend account** (free tier, for email) — [https://resend.com](https://resend.com)
-   Google Cloud Console account (optional — for Google OAuth)

### Initial Setup

1.  **Clone the repository:**
    
    ```bash
    git clone https://github.com/ielihasan/Business_pro_hub.gitcd Business_pro_hub
    ```
    
2.  **Install frontend dependencies:**
    
    ```bash
    cd dashboard && npm installcd ..
    ```
    
3.  **Configure frontend environment variables:**
    
    ```bash
    cp dashboard/.env.example dashboard/.env.local# Then edit dashboard/.env.local with your values
    ```
    
4.  **Configure backend environment variables:**
    
    ```bash
    cp backend/.env.example backend/.env# Then edit backend/.env with your values
    ```
    
5.  **Set up Supabase database:**
    
    -   Follow the [Database Setup](#database-setup) section
6.  **Start the Spring Boot backend** (terminal 1):
    
    ```bash
    cd backend# Load env vars and start (Linux/macOS/Git Bash)export $(grep -v '^#' .env | xargs) && mvn spring-boot:run# Windows CMD# Set each variable manually then: mvn spring-boot:run
    ```
    
    Backend will be available at: **[http://localhost:8080](http://localhost:8080)**
    
7.  **Start the Next.js frontend** (terminal 2):
    
    ```bash
    cd dashboard && npm run dev
    ```
    
    Frontend will be available at: **[http://localhost:3002](http://localhost:3002)**
    
8.  **Access the application:**
    
    -   **Landing Page**: [http://localhost:3002/](http://localhost:3002/)
    -   **Login**: [http://localhost:3002/auth/v1/login](http://localhost:3002/auth/v1/login)
    -   **Register**: [http://localhost:3002/auth/v1/register](http://localhost:3002/auth/v1/register)
    -   **Admin Dashboard**: [http://localhost:3002/admin/dashboard](http://localhost:3002/admin/dashboard)
    -   **Business Dashboard**: [http://localhost:3002/business/dashboard](http://localhost:3002/business/dashboard)

---

## Project Structure

```
Business_pro_hub/├── dashboard/                    # Next.js frontend (port 3002)│   ├── src/│   │   ├── app/                 # App Router pages│   │   │   ├── (external)/      # Landing page & public routes│   │   │   ├── (main)/auth/     # Authentication pages│   │   │   ├── admin/           # Admin dashboard│   │   │   ├── business/        # Business owner dashboard│   │   │   └── join-queue/      # Public queue join page (QR scan)│   │   ├── components/          # Reusable UI components│   │   ├── lib/                 # Utilities, helpers, Supabase client│   │   └── types/               # TypeScript definitions│   ├── public/                  # Static assets│   ├── .env.example             # Frontend environment template ← copy to .env.local│   └── package.json├── backend/                     # Spring Boot backend (port 8080)│   ├── src/main/java/com/businessprohub/backend/│   │   ├── controller/          # REST controllers (Queue, Auth, Pricing, …)│   │   ├── service/             # Business logic│   │   ├── entity/              # JPA entities (Queue, Business, …)│   │   ├── repository/          # Spring Data JPA repositories│   │   ├── security/            # JWT auth filter + SecurityConfig│   │   └── config/              # CORS, security config│   ├── src/main/resources/│   │   └── application.properties│   ├── .env.example             # Backend environment template ← copy to .env│   └── pom.xml                  # Maven dependencies├── database/                    # SQL schema & migrations│   ├── create_businesses_table.sql│   ├── business_applications.sql│   ├── allow_multiple_roles.sql│   ├── fix_email_constraint.sql│   └── subscriptions_and_payments.sql├── SUPABASE_SETUP.md           # Detailed Supabase setup guide├── GOOGLE_OAUTH_SETUP.md       # Google OAuth configuration└── README.md                  # This file
```

---

## Contributor Setup Guide

This section provides step-by-step instructions for new contributors to set up the complete development environment.

### Step 1: Clone and Install

```bash
# Clone the repositorygit clone https://github.com/ielihasan/Business_pro_hub.gitcd Business_pro_hub# Install frontend dependenciescd dashboard && npm install && cd ..# Backend dependencies are handled by Maven automatically on first run
```

### Step 2: Create Supabase Project

1.  Go to [supabase.com](https://supabase.com) and create a free account
2.  Click "New Project" and fill in:
    -   **Project name**: `businesshub-pro` (or your choice)
    -   **Database Password**: Create a strong password (save this!)
    -   **Region**: Choose closest to you
3.  Wait for the project to be created (takes ~2 minutes)
4.  Once ready, go to **Settings → API** and note down:
    -   **Project URL** (looks like: `https://xxxxxxxx.supabase.co`)
    -   **anon/public key** (starts with `eyJ...`)
    -   **service_role key** (starts with `eyJ...`) - Keep this secret!

### Step 3: Create Environment Files

**Frontend** — copy the template and fill in your values:

```bash
cp dashboard/.env.example dashboard/.env.local
```

`dashboard/.env.local` content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.coNEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_hereSUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_hereNEXT_PUBLIC_APP_URL=http://localhost:3002NEXT_PUBLIC_API_URL=http://localhost:8080RESEND_API_KEY=re_xxxxxxxxx_xxxxxxxxxxxxxxxxxxxxRESEND_FROM_EMAIL=BusinessHub Pro <onboarding@resend.dev>ADMIN_NOTIFICATION_EMAIL=admin@example.com
```

**Backend** — copy the template and fill in your values:

```bash
cp backend/.env.example backend/.env
```

`backend/.env` content:

```env
SUPABASE_DB_PASSWORD=your_supabase_db_password_hereSUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_hereSUPABASE_JWT_SECRET=your_supabase_jwt_secret_hereRESEND_API_KEY=re_xxxxxxxxx_xxxxxxxxxxxxxxxxxxxxADMIN_NOTIFICATION_EMAIL=admin@example.com
```

### Step 4: Set Up Resend (Email Service)

1.  Go to [resend.com](https://resend.com) and create a free account
2.  Navigate to **API Keys** and create a new API key
3.  Copy the API key (starts with `re_`) and add it to `.env.local`

**For Development (No Custom Domain):**

```env
RESEND_API_KEY=re_your_api_key_hereRESEND_FROM_EMAIL=BusinessHub Pro <onboarding@resend.dev>
```

**For Production (With Custom Domain):**

-   Add and verify your domain in Resend dashboard
-   Update `RESEND_FROM_EMAIL` to use your verified domain

### Step 5: Run Database Migrations

1.  Go to your Supabase Dashboard
2.  Navigate to **SQL Editor**
3.  Run the following SQL files **in order**:

**Migration 1: Core Tables (business_applications.sql)**

```sql
-- Copy content from: database/business_applications.sql
```

**Migration 2: Multiple Roles Support (allow_multiple_roles.sql)**

```sql
-- Copy content from: database/allow_multiple_roles.sql
```

**Migration 3: Email Constraint Fix (fix_email_constraint.sql)**

```sql
-- Copy content from: database/fix_email_constraint.sql
```

**Migration 4: Subscriptions & Payments (subscriptions_and_payments.sql)**

```sql
-- Copy content from: database/subscriptions_and_payments.sql
```

For complete table schemas, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

### Step 6: Configure Supabase Authentication

1.  In Supabase Dashboard, go to **Authentication → Providers**
2.  Enable **Email** provider
3.  Configure email templates (optional but recommended)

**For Google OAuth (Optional):**

1.  Go to [Google Cloud Console](https://console.cloud.google.com)
2.  Create OAuth 2.0 credentials
3.  Add authorized redirect URIs:
    
    ```
    http://localhost:3001/auth/login-callbackhttp://localhost:3001/auth/oauth-callbackhttps://your-project-id.supabase.co/auth/v1/callback
    ```
    
4.  In Supabase Dashboard → Authentication → Providers:
    -   Enable **Google** provider
    -   Add your Client ID and Client Secret

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.

### Step 7: Configure Redirect URLs in Supabase

1.  Go to Supabase Dashboard → **Authentication → URL Configuration**
2.  Add these to **Redirect URLs**:
    
    ```
    http://localhost:3001/auth/login-callbackhttp://localhost:3001/auth/oauth-callbackhttp://localhost:3001/auth/verify-email
    ```
    

### Step 8: Start Development Servers

**Terminal 1 — Spring Boot backend:**

```bash
cd backend# Linux / macOS / Git Bash on Windowsexport $(grep -v '^#' .env | xargs) && mvn spring-boot:run# Windows CMD (set vars manually or use a .bat wrapper)mvn spring-boot:run
```

Backend available at: **[http://localhost:8080](http://localhost:8080)**

**Terminal 2 — Next.js frontend:**

```bash
cd dashboard && npm run dev
```

Frontend available at: **[http://localhost:3002](http://localhost:3002)**

### Step 9: Create First Admin Account

1.  Go to [http://localhost:3001/auth/v1/register](http://localhost:3001/auth/v1/register)
2.  Select "Platform Admin" as the role
3.  Fill in your details and register
4.  Check your email for verification link
5.  Admin accounts are auto-approved

---

## Environment Variables

### Frontend (`dashboard/.env.local`)

Variable

Description

Where to Get

`NEXT_PUBLIC_SUPABASE_URL`

Supabase project URL

Supabase Dashboard → Settings → API

`NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase anon/public key

Supabase Dashboard → Settings → API

`SUPABASE_SERVICE_ROLE_KEY`

Supabase service role key (server-side)

Supabase Dashboard → Settings → API

`NEXT_PUBLIC_APP_URL`

Frontend URL

`http://localhost:3002` for development

`NEXT_PUBLIC_API_URL`

Spring Boot backend URL

`http://localhost:8080` for development

`RESEND_API_KEY`

Resend email API key

[resend.com/api-keys](https://resend.com/api-keys)

`RESEND_FROM_EMAIL`

Email sender address

`onboarding@resend.dev` for dev

`ADMIN_NOTIFICATION_EMAIL`

Email for admin alerts

Any valid email

### Backend (`backend/.env`)

Variable

Description

Where to Get

`SUPABASE_DB_PASSWORD`

Supabase Postgres password

Supabase Dashboard → Settings → Database

`SUPABASE_SERVICE_ROLE_KEY`

Supabase service role key

Supabase Dashboard → Settings → API

`SUPABASE_JWT_SECRET`

JWT secret for token verification

Supabase Dashboard → Settings → API → JWT Secret

`RESEND_API_KEY`

Resend email API key

[resend.com/api-keys](https://resend.com/api-keys)

`ADMIN_NOTIFICATION_EMAIL`

Email for admin alerts

Any valid email

### Example .env.local File

```env
# Supabase (REQUIRED)NEXT_PUBLIC_SUPABASE_URL=https://hjblbmmyfznxomsrxhme.supabase.coNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...# App URL (REQUIRED)NEXT_PUBLIC_APP_URL=http://localhost:3001# Resend Email Service (REQUIRED)RESEND_API_KEY=re_M3sMJX4L_NwVNFRLcqXnJTZCHnpXbvTsVRESEND_FROM_EMAIL=BusinessHub Pro <noreply@businessprohub.me># OptionalADMIN_NOTIFICATION_EMAIL=admin@businessprohub.me
```

---

## Database Setup

### Required Tables

The application requires the following database tables:

Table

Purpose

Migration File

`admins`

Admin and business owner profiles

`business_applications.sql`

`business_applications`

Pending business registrations

`business_applications.sql`

`User`

Customer/end-user profiles

`SUPABASE_SETUP.md`

`profiles`

Additional user profiles

`SUPABASE_SETUP.md`

`conversations`

Support chat conversations

`SUPABASE_SETUP.md`

`messages`

Chat messages

`SUPABASE_SETUP.md`

`queue_types`

Business queue categories

`SUPABASE_SETUP.md`

`queue_entries`

Individual queue entries

`SUPABASE_SETUP.md`

`subscriptions`

Payment subscriptions

`subscriptions_and_payments.sql`

`payments`

Payment transactions

`subscriptions_and_payments.sql`

### Migration Order

Run migrations in this order:

1.  `SUPABASE_SETUP.md` - Core tables (admins, User, profiles, etc.)
2.  `database/business_applications.sql` - Business application system
3.  `database/allow_multiple_roles.sql` - Multi-role support
4.  `database/fix_email_constraint.sql` - Email uniqueness fix
5.  `database/subscriptions_and_payments.sql` - Payment system

### Key Database Features

-   **Row Level Security (RLS)**: Enabled on all tables
-   **Multi-role Support**: Users can have both admin + business_owner roles
-   **Composite Primary Key**: `(id, role)` for admins table
-   **Auto-updating timestamps**: `updated_at` triggers on all tables

---

## External Services Configuration

### 1. Supabase (Database & Auth)

**Required for:** Database, Authentication, File Storage

**Setup:**

1.  Create account at [supabase.com](https://supabase.com)
2.  Create new project
3.  Get API keys from Settings → API
4.  Run database migrations
5.  Configure authentication providers

**Free Tier Includes:**

-   500MB database
-   1GB file storage
-   2GB bandwidth
-   50,000 monthly active users

### 2. Resend (Email Service)

**Required for:** Email verification, Approval notifications, Password reset

**Setup:**

1.  Create account at [resend.com](https://resend.com)
2.  Get API key from dashboard
3.  (Optional) Add and verify custom domain

**Free Tier Includes:**

-   3,000 emails/month
-   100 emails/day

**Email Templates Used:**

-   Email verification
-   Account approval notification
-   Account rejection notification
-   Admin notifications

### 3. Google OAuth (Optional)

**Required for:** Google Sign-In

**Setup:**

1.  Go to [Google Cloud Console](https://console.cloud.google.com)
2.  Create a new project or select existing
3.  Enable Google+ API
4.  Create OAuth 2.0 credentials
5.  Configure authorized redirect URIs
6.  Add credentials to Supabase Dashboard

**Redirect URIs to Configure:**

```
# Developmenthttp://localhost:3001/auth/login-callbackhttp://localhost:3001/auth/oauth-callbackhttps://your-project-id.supabase.co/auth/v1/callback# Productionhttps://yourdomain.com/auth/login-callbackhttps://yourdomain.com/auth/oauth-callback
```

---

## Application Features

### Landing Page (/)

-   Modern, responsive design
-   Features showcase
-   Customer testimonials
-   Pricing plans
-   Smooth scroll navigation
-   Call-to-action buttons linking to registration

### Authentication

-   **Login**: Email/password + Google OAuth
-   **Registration**:
    -   Business Owner registration (requires admin approval)
    -   Platform Admin registration (auto-approved)
-   **Email Verification**: Required before approval
-   **Multi-role Support**: Same user can have multiple roles

### Dashboards

**Admin Dashboard** (`/admin/dashboard`)

-   Platform analytics
-   Business approval management
-   User management
-   Payment tracking
-   System settings

**Business Owner Dashboard** (`/business/dashboard`)

-   Queue management
-   Order tracking
-   Customer database
-   Business analytics
-   Pricing management
-   Staff management
-   Business hours configuration

### Queue System

-   QR code generation for queue joining
-   Real-time queue status
-   Multiple queue types per business
-   Customer wait time tracking
-   Priority levels (normal, high, VIP)

---

## User Roles & Access

### 1. Platform Admin

-   **Access**: Full platform control
-   **Dashboard**: `/admin/dashboard`
-   **Approval**: Auto-approved on registration
-   **Features**:
    -   Manage all businesses
    -   Approve/reject business registrations
    -   View platform analytics
    -   User management
    -   Payment management

### 2. Business Owner

-   **Access**: Business-specific features
-   **Dashboard**: `/business/dashboard`
-   **Approval**: Requires admin approval
-   **Features**:
    -   Queue management
    -   Customer analytics
    -   Order tracking
    -   Business settings
    -   Staff management

### 3. Regular User/Customer

-   **Access**: Customer-facing features
-   **Features**:
    -   Join queues via QR code or link
    -   Track order status
    -   View wait times

### Multi-Role Support

-   Same email can have both admin and business_owner roles
-   Upon login with multiple roles, user selects which dashboard to access
-   Role stored in sessionStorage for the session

---

## Tech Stack

### Frontend

-   **Framework**: Next.js 16 with App Router + Turbopack
-   **UI**: React 19 + Tailwind CSS 4 + Shadcn/UI
-   **State Management**: Zustand 5
-   **Forms**: React Hook Form 7 + Zod
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Animations**: Framer Motion
-   **QR Codes**: qrcode

### Backend

-   **Framework**: Spring Boot 3.2.5 (Java 17)
-   **API**: REST (Spring MVC)
-   **Database ORM**: Spring Data JPA / Hibernate
-   **Security**: Spring Security + Supabase JWT (ES256/ECDSA)
-   **Build Tool**: Maven 3.9+

### Infrastructure

-   **Database**: Supabase (PostgreSQL) with PgBouncer
-   **Authentication**: Supabase Auth (Email + Google OAuth)
-   **Email**: Resend

---

## API Endpoints

### Authentication

-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/verify-email` - Verify email address
-   `POST /api/auth/send-verification` - Send verification email
-   `POST /api/auth/resend-verification` - Resend verification email
-   `POST /api/auth/send-approval-notification` - Send approval notification

### Admin Management

-   `GET /api/admins` - List all admins
-   `POST /api/admins/create` - Create admin
-   `PUT /api/admins/update` - Update admin
-   `DELETE /api/admins/delete` - Delete admin

### Business Management

-   `GET /api/businesses` - List businesses
-   `POST /api/businesses/create` - Create business
-   `PUT /api/businesses/update` - Update business
-   `DELETE /api/businesses/delete` - Delete business

### Queue Management

-   `GET /api/queue` - Get queue entries
-   `POST /api/queue/join` - Join queue
-   `GET /api/queue/status` - Get queue status
-   `GET /api/queue/info` - Get queue info
-   `GET /api/queue/qrcode` - Generate QR code
-   `PUT /api/queue/[id]` - Update queue entry

### Other Endpoints

-   `/api/customers` - Customer management
-   `/api/orders` - Order management
-   `/api/pricing` - Pricing management
-   `/api/business-hours` - Business hours management
-   `/api/queue-types` - Queue type management
-   `/api/settings/profile` - Profile settings
-   `/api/settings/password` - Password settings

---

## Development Commands

```bash
# Install dependenciesnpm run install:all# Run development server (port 3001)npm run dev# Build for productionnpm run build# Start production servernpm start# Lint codecd dashboard && npm run lint# Format codecd dashboard && npm run format# Check formattingcd dashboard && npm run format:check
```

---

## Troubleshooting

### Common Issues

**1. "Supabase URL not found" error**

-   Ensure `.env.local` exists in `dashboard/` directory
-   Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly
-   Restart the development server

**2. Email not sending**

-   Verify `RESEND_API_KEY` is correct
-   Check Resend dashboard for API key status
-   For development, use `onboarding@resend.dev` as sender

**3. Google OAuth not working**

-   Verify redirect URLs are added to Google Cloud Console
-   Check that redirect URLs are added to Supabase
-   Ensure Google provider is enabled in Supabase

**4. "Duplicate key" database error**

-   Run `database/allow_multiple_roles.sql` migration
-   Run `database/fix_email_constraint.sql` migration

**5. Login redirects to wrong page**

-   Clear browser cache and cookies
-   Check sessionStorage in browser dev tools
-   Verify authentication middleware is working

**6. Business not appearing after approval**

-   Check `admins` table for the record
-   Verify `is_approved = true`
-   Check email verification status

### Getting Help

1.  Check existing issues on GitHub
2.  Review Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
3.  Check browser console for error messages
4.  Review server logs in terminal

---

## Contributing

Contributions are welcome! Please follow these steps:

1.  **Fork the repository**
2.  **Create a feature branch**:
    
    ```bash
    git checkout -b feature/your-feature-name
    ```
    
3.  **Set up your development environment** following the [Contributor Setup Guide](#contributor-setup-guide)
4.  **Make your changes**
5.  **Run linting and formatting**:
    
    ```bash
    cd dashboardnpm run lintnpm run format
    ```
    
6.  **Commit your changes**:
    
    ```bash
    git commit -m "feat: add your feature description"
    ```
    
7.  **Push to your fork**:
    
    ```bash
    git push origin feature/your-feature-name
    ```
    
8.  **Create a Pull Request**

### Commit Message Convention

-   `feat:` - New features
-   `fix:` - Bug fixes
-   `docs:` - Documentation changes
-   `style:` - Code style changes (formatting, etc.)
-   `refactor:` - Code refactoring
-   `test:` - Adding or updating tests
-   `chore:` - Maintenance tasks

---

## License

See individual project directories for license information.

---

## Support

For issues or questions:

-   Create an issue on GitHub
-   Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
-   Check Resend documentation: [https://resend.com/docs](https://resend.com/docs)
# Business Pro Hub

A comprehensive business management platform with an integrated landing page and powerful dashboard featuring real-time queue optimization.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure Supabase:**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create `.env.local` in the `dashboard/` directory with your Supabase keys

3. **Run the application:**
   ```bash
   npm run dev
   ```

   Or use the batch file on Windows:
   ```bash
   start-dev.bat
   ```

4. **Access the application:**
   - **Landing Page**: http://localhost:3001/
   - **Login**: http://localhost:3001/auth/v1/login
   - **Register**: http://localhost:3001/auth/v1/register
   - **Admin Dashboard**: http://localhost:3001/admin/dashboard
   - **Business Dashboard**: http://localhost:3001/business/dashboard

## Project Structure

```
Business_pro_hub/
├── dashboard/            # Main application (landing + dashboard)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page (/)
│   │   │   ├── (main)/auth/          # Authentication pages
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── business/             # Business owner dashboard
│   │   │   └── waiting-approval/     # Approval pending page
│   │   ├── components/               # Reusable UI components
│   │   └── lib/                      # Utilities and helpers
├── SUPABASE_SETUP.md     # Database setup guide
├── package.json          # Root package manager
├── start-dev.bat         # Windows quick start script
└── README.md             # This file
```

## Application Features

### Landing Page (/)
- Modern, responsive design
- Features showcase
- Customer testimonials
- Pricing plans
- Smooth scroll navigation
- Call-to-action buttons linking to registration

### Authentication
- **Login**: Email/password + Google OAuth
- **Registration**:
  - Business Owner registration (requires admin approval)
  - Platform Admin registration (auto-approved)
- **Role-based access control**

### Dashboards

**Admin Dashboard** (`/admin/dashboard`)
- Platform analytics
- Business approval management
- User management
- System settings

**Business Owner Dashboard** (`/business/dashboard`)
- Queue management
- Order tracking
- Customer database
- Business analytics

## 📋 Supabase Configuration Required

**IMPORTANT:** Before running the application, you need to:

1. **Set up Supabase tables** - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete SQL scripts
2. **Add environment variables** - Create `dashboard/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

### Required Tables:
- `admins` - Admin and business owner profiles with roles
- `User` - Customer/end-user profiles
- `profiles` - Additional user profiles
- `conversations` - Support chat conversations
- `messages` - Chat messages
- `business_types` - Business type categories
- `queues` (optional) - Queue management
- `queue_entries` (optional) - Queue entries

All SQL scripts with Row Level Security policies are provided in SUPABASE_SETUP.md.

## Development

### Run Development Server
```bash
npm run dev
```

The application will be available at http://localhost:3001

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## User Roles & Access

### 1. Platform Admin
- **Access**: Full platform access
- **Dashboard**: `/admin/dashboard`
- **Approval**: Auto-approved on registration
- **Features**:
  - Manage all businesses
  - Approve/reject business registrations
  - View platform analytics
  - User management

### 2. Business Owner
- **Access**: Business-specific features
- **Dashboard**: `/business/dashboard`
- **Approval**: Requires admin approval
- **Features**:
  - Queue management
  - Customer analytics
  - Order tracking
  - Business settings

### 3. Regular User/Customer
- **Access**: Customer-facing features
- **Dashboard**: `/dashboard`
- **Features**:
  - Join queues
  - Track orders
  - View wait times

## Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **UI**: React 19 + Tailwind CSS + Shadcn/UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack React Query + Axios
- **Charts**: Recharts
- **Icons**: Lucide React

## License

See individual project directories for license information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

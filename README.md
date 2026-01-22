# Business Pro Hub

A comprehensive business management platform combining a modern landing page and a powerful dashboard with real-time queue optimization.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn

### Initial Setup

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure Supabase:**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create `.env.local` in the `dashboard/` directory with your Supabase keys

3. **Run both applications:**
   ```bash
   # Terminal 1 - Landing Page (port 3000)
   npm run dev:landing

   # Terminal 2 - Dashboard (port 3001)
   npm run dev:dashboard
   ```

4. **Access the applications:**
   - Landing Page: http://localhost:3000
   - Dashboard Login: http://localhost:3001/auth/v1/login
   - Click "Get Started" button on landing page → redirects to dashboard login

## Project Structure

```
Business_pro_hub/
├── landing-page/         # Landing page for Business Pro Hub
├── dashboard/            # Dashboard application
├── SUPABASE_SETUP.md     # Database setup guide
└── README.md             # This file
```

## Components

### Landing Page
Located in `landing-page/` directory. A modern, responsive landing page built with Next.js and Tailwind CSS.

**Features:**
- Responsive design
- Modern UI components
- SEO optimized

**Setup:**
```bash
cd landing-page
npm install
npm run dev
```

The landing page will be available at `http://localhost:3000`

### Dashboard
Located in `dashboard/` directory. A comprehensive dashboard application for business management.

**Features:**
- Business analytics
- Data visualization
- User management
- Responsive layout

**Setup:**
```bash
cd dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3001` (or next available port)

## 📋 Supabase Configuration Required

**IMPORTANT:** Before running the dashboard, you need to:

1. **Set up Supabase tables** - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete SQL scripts
2. **Add environment variables** - Create `dashboard/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

### Required Tables:
- `admins` - Admin user profiles
- `User` - Customer/end-user profiles
- `profiles` - Additional user profiles
- `conversations` - Support chat conversations
- `messages` - Chat messages
- `queues` (optional) - Queue management
- `queue_entries` (optional) - Queue entries

All SQL scripts with Row Level Security policies are provided in SUPABASE_SETUP.md.

## Development

Each component (landing-page and dashboard) is a standalone Next.js application with its own dependencies and configuration.

### Landing Page Development
```bash
cd landing-page
npm run dev
```

### Dashboard Development
```bash
cd dashboard
npm run dev
```

## Building for Production

### Landing Page
```bash
cd landing-page
npm run build
npm start
```

### Dashboard
```bash
cd dashboard
npm run build
npm start
```

## License

See individual project directories for license information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

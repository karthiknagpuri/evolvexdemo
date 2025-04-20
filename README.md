# EvolveX Demo

A Next.js application with Clerk authentication and Supabase integration.

## Features

- Next.js 14.1.0 with App Router
- Clerk Authentication
- Supabase Database Integration
- Real-time Webhook Processing
- User Profile Management

## Setup

1. Clone the repository:
```bash
git clone https://github.com/karthiknagpuri/evolvexdemo.git
cd evolvexdemo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   - Update the values in `.env.local` with your actual credentials:
     - Get Clerk credentials from [Clerk Dashboard](https://dashboard.clerk.dev/)
     - Get Supabase credentials from [Supabase Dashboard](https://app.supabase.io/)

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

The following environment variables are required:

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `CLERK_WEBHOOK_SECRET`: Your Clerk webhook secret
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: Path to sign-in page (default: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Path to sign-up page (default: `/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: Redirect path after sign-in (default: `/`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: Redirect path after sign-up (default: `/`)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for webhook handler)

## Project Structure

- `/src/app` - Next.js application routes and components
- `/src/app/api` - API routes including webhook handler
- `/src/lib` - Utility functions and configurations
- `/supabase` - Supabase migrations and configurations

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

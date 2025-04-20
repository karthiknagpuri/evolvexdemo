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
Create a `.env.local` file with:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server:
```bash
npm run dev
```

## Project Structure

- `/src/app` - Next.js application routes and components
- `/src/app/api` - API routes including webhook handler
- `/src/lib` - Utility functions and configurations
- `/supabase` - Supabase migrations and configurations

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

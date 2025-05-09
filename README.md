# Event Booking System

A full-stack web application for event booking and management built with React, Supabase, and pure CSS.

## Features

- 🔐 **Authentication**: User registration and login with Supabase Auth
- 🏠 **Home Page**: Display events in a grid layout with filtering options
- 📄 **Event Details**: View complete information for individual events
- 🎫 **Booking System**: Book tickets for events with confirmation
- 💼 **My Bookings**: View and manage your booked events
- 👑 **Admin Panel**: Create, read, update, and delete events
- 📱 **Responsive Design**: Web optimized UI with pure CSS

## Tech Stack

- **Frontend**: React (Vite), TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Pure CSS (no frameworks)
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository

   ```
   git clone <repository-url>
   cd event-booking-system
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Set up Supabase

   - Create a new Supabase project
   - Run the SQL script in `supabase-schema.sql` in the SQL Editor
   - Set up storage buckets as per the script

4. Configure environment variables

   - Copy `.env` to `.env.local`
   - Update with your Supabase credentials

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server
   ```
   npm run dev
   ```

## Project Structure

```
event-booking-system/
├── src/
│   ├── components/       # Reusable components
│   │   ├── admin/        # Admin-specific components
│   │   ├── auth/         # Authentication components
│   │   ├── events/       # Event-related components
│   │   └── layout/       # Layout components (navbar, footer)
│   ├── context/          # Context providers
│   ├── lib/              # Utility functions
│   │   └── supabase/     # Supabase client
│   ├── pages/            # Page components
│   ├── styles/           # CSS stylesheets
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── supabase-schema.sql   # Database schema
```

## User Roles

- **User**: Can browse events, make bookings, and manage their own bookings
- **Admin**: Can create, edit, and delete events, as well as all user capabilities

## Supabase Setup

The `supabase-schema.sql` file contains all necessary SQL to set up:

- Events and bookings tables
- Storage bucket for event images
- Row-Level Security (RLS) policies

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

[Your Name]

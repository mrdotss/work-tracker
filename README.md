# Work Tracker

A comprehensive vehicle inspection management system built with Next.js and Prisma.

## Overview

Work Tracker is a web application designed to streamline the process of daily vehicle inspections. It allows staff members to complete and submit inspection checklists for vehicles or equipment, with the ability to attach proof photos. Administrators can review submissions, manage staff accounts, and generate reports.

## Features

### Staff Portal
- Complete daily vehicle inspection checklists
- Attach proof photos to inspection items
- View and edit submission history
- Track inspection status (pending, approved, rejected)

### Admin Portal
- Review and approve/reject staff submissions
- Manage staff accounts (create, edit, deactivate)
- View comprehensive task records with filtering options
- Generate reports and export data

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, Lucide React icons
- **Form Handling**: React Hook Form, Zod validation
- **Data Export**: XLSX, jsPDF
- **Data Visualization**: Recharts

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/work-tracker.git
   cd work-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/work_tracker"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
work-tracker/
├── app/                  # Next.js app directory
│   ├── admin/            # Admin portal pages
│   ├── api/              # API routes
│   ├── staff/            # Staff portal pages
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── admin/            # Admin-specific components
│   ├── landing/          # Landing page components
│   ├── staff/            # Staff-specific components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and libraries
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Usage

### Staff Workflow
1. Log in to the staff portal
2. Navigate to the "Daily Workcheck" tab
3. Select a vehicle/unit to inspect
4. Complete the inspection checklist
5. Attach required proof photos
6. Submit the inspection
7. View submission history and status in the "My History" tab

### Admin Workflow
1. Log in to the admin portal
2. Review pending submissions in the "Task Records" tab
3. Approve or reject submissions with comments
4. Manage staff accounts in the "Staff Management" tab
5. Generate reports and export data as needed

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [NextAuth.js](https://next-auth.js.org/)

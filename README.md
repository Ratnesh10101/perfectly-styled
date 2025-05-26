# Perfectly Styled (Next.js App in Firebase Studio)

This is a Next.js application for personalized style analysis.

## Features

- Interactive questionnaire for style analysis.
- AI-powered recommendations.
- Direct report generation and simulated email delivery (no user accounts).

## Getting Started

To get the development server running:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9003](http://localhost:9003) (or your configured port) with your browser to see the result.

## Environment Variables

For local development, create a `.env.local` file in the root of the project and add your Firebase project credentials and Google AI API key:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID

GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
```

For deployment to Firebase, ensure these environment variables are configured in your Firebase project settings (e.g., via Firebase Functions config or Firebase Studio's environment variable settings).

## Key Technologies

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- ShadCN UI
- Genkit (for AI features)
- Firebase (for deployment and backend services if extended)

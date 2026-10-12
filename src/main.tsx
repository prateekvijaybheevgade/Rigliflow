import { ClerkProvider } from '@clerk/react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key: Ensure VITE_CLERK_PUBLISHABLE_KEY is configured in your environment.');
}

createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <App />
  </ClerkProvider>
);
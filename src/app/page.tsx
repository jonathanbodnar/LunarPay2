import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard (or login if not authenticated - middleware handles this)
  redirect('/dashboard');
}

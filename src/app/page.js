import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Server-side redirect to maintenance page
  redirect('/maintenance')
}

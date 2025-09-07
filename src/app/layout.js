import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from '@/components/SessionProvider'
import Navigation from '@/components/Navigation'
import FCMHandler from '@/components/FCMHandler'

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "OlympCom - Olympus Community",
  description: "A private-first social media web app for the Olympus friend group with real-time chat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <SessionProvider>
          <Navigation />
          <FCMHandler />
          <main className="min-h-screen">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

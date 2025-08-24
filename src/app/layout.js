import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from '@/components/SessionProvider'
import Navigation from '@/components/Navigation'

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "OlympCom - Olympus Community",
  description: "A private-first social media web app for the Olympus friend group",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <SessionProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

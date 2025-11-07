import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Salesforce API Test Bench",
  description: "Test and validate Salesforce API endpoints across multiple environments",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Navigation />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}

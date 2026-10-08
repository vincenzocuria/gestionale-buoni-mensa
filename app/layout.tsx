import type { Metadata } from "next"
import { Newsreader, Source_Sans_3 } from "next/font/google"
import { FooterPrivacy } from "@/components/footer-privacy"
import "./globals.css"

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-app-sans",
})

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-app-serif",
})

export const metadata: Metadata = {
  title: {
    default: "Buoni mensa — San Lorenzo del Vallo",
    template: "%s — Buoni mensa",
  },
  description: "Registro delle consegne dei blocchetti mensa del Comune di San Lorenzo del Vallo.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <FooterPrivacy />
      </body>
    </html>
  )
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter throughout, per the supplied style guide. Numerals are aligned with
// font-variant-numeric rather than by switching to a monospaced face.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const sans = inter;
const mono = { variable: "" };
const serif = sans;

export const metadata: Metadata = {
  title: "Oil and Gas Outlook",
  description:
    "Nigerian upstream and downstream indicators rebuilt from 22 OPEC Monthly Oil Market Reports, with scenario levers and a twelve-month company outlook projection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Light is the default. Dark is opt-in via the toggle only, never inherited from the OS.
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}

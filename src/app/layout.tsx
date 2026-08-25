import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-plex-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-plex-mono", display: "swap" });
const serif = IBM_Plex_Serif({ subsets: ["latin"], weight: ["400","600"], variable: "--font-plex-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Barrel Ledger",
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

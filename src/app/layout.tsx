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

const SITE = "https://oilgas.vandor.tech";
const DESCRIPTION =
  "Nigerian upstream and downstream indicators rebuilt from 22 OPEC Monthly Oil Market Reports, plus NUPRC and NMDPRA releases. Every figure names its source.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Oil and Gas Outlook",
  description: DESCRIPTION,
  applicationName: "Oil and Gas Outlook",
  authors: [{ name: "Claret Ibeawuchi" }],
  keywords: [
    "Nigeria", "oil and gas", "OPEC", "NUPRC", "NMDPRA",
    "crude production", "natural gas", "energy data",
  ],
  alternates: { canonical: SITE },
  // Link unfurls on LinkedIn and elsewhere read these.
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Oil and Gas Outlook",
    title: "Oil and Gas Outlook · Nigeria",
    description: DESCRIPTION,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oil and Gas Outlook · Nigeria",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
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

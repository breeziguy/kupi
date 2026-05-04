import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "KUPI — Your iMessage Wingman",
  description: "AI-powered dating wingman that lives in iMessage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

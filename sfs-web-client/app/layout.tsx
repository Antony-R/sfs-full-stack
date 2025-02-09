import type { Metadata } from "next";
import { Big_Shoulders_Display, Big_Shoulders_Text, Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar/navbar";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const bigShouldersDisplay = Big_Shoulders_Display({
  variable: "--font-big-shoulders-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Short Film Streaming",
  description: "A site used to stream short films.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} ${manrope.variable} ${bigShouldersDisplay.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

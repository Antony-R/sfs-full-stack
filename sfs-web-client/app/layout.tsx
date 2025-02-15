import type { Metadata } from "next";
import { Big_Shoulders_Display, Jost, Manrope, Rubik } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar/navbar";
import { AuthProvider } from "./AuthContext";

const rubik = Rubik({
  variable: "--font-rubik",
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
      <AuthProvider>
        <body className={`${rubik.variable} ${manrope.variable} ${bigShouldersDisplay.variable}`}>
          <Navbar />
          {children}
        </body>
      </AuthProvider>
    </html>
  );
}

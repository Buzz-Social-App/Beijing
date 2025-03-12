import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Authentication - Buzz Dashboard",
    description: "Authentication for Buzz Dashboard",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} antialiased bg-[#0f0f0f] text-white`}>
                {children}
            </body>
        </html>
    );
} 
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
// import { loadGoogleMapsApi } from "@/lib/google-maps";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Buzz Dashboard",
    description: "Buzz Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    // loadGoogleMapsApi();

    return (
        <html lang="en" className="dark">
            <head />
            <body className={`${inter.variable} antialiased`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}

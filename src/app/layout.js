import "./globals.css";


export const metadata = {
    title: "trader engine",
    description: "trade & trade",
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}

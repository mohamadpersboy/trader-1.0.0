import "./globals.css";

import {ThemeProvider} from "@appica/ui-react/providers/theme-provider";


export const metadata = {
    title: "Trader Engine — Dashboard",
    description: "SMC pattern dashboard: candles, CHOCH, BOS & FVG",
};

export default function RootLayout({children}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body>
        {/* forcedTheme="light": product requirement is a light-only dashboard,
            matching appica.dev's own light theme - no dark mode toggle. */}
        <ThemeProvider forcedTheme="light">
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}

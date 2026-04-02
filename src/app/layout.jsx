import "./globals.css";

export const metadata = {
  title: "Synapse — Decision Intelligence",
  description: "AI-native decision coordination on GenLayer Bradbury.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

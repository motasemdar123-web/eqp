import "./globals.css";

export const metadata = {
  title: "Dar Al HAI Maintenance Management",
  description: "Unified maintenance, scheduling, operations, and EQP reporting platform",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

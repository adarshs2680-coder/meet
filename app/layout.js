import "./globals.css";
import NotificationProvider from "./NotificationProvider";

export const metadata = {
  title: "Meet Presence",
  description: "One-on-one doubt clearing with presence indicator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider />
        {children}
      </body>
    </html>
  );
}

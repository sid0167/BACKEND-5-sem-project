import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "Stock AI",
  description: "AI-driven market recommendations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", background: "#0b0c10", color: "#f2f2f2" }}>
          <Header />
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>{children}</div>
        </div>
      </body>
    </html>
  );
}

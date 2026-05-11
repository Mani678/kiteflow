export const metadata = {
  title: "KiteFlow — Stripe for AI Agents",
  description:
    "Every agent call is a verifiable payment. Every workflow is a provable receipt. On Kite chain.",
  openGraph: {
    title: "KiteFlow — Stripe for AI Agents",
    description:
      "Autonomous multi-agent workflows with x402 payments and on-chain attestation on Kite chain.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#080810", color: "#e2e2e8" }}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'PromptIQ - Premium AI Prompt Scorer & Optimizer',
  description: 'Evaluate, score, and optimize your LLM prompts in real-time with state-of-the-art token telemetry and detailed dimension analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <div className="mesh-bg" />
        {children}
      </body>
    </html>
  );
}

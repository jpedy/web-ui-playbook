// Fixture: a Next.js root layout — holds <html> but no <h1> (the page has it): no "Page has no <h1>" warning.
export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  return (
    <html lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>
      <head><script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} /></head>
      <body className="bg-bg text-text">{children}</body>
    </html>
  );
}

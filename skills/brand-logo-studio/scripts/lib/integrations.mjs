/**
 * brand-logo-studio — integrations.mjs
 * How the finished kit plugs into the user's stack: extra files written next to the kit and the install sentence
 * for kit-report.md. The masters, PNGs, favicon.ico/svg and site.webmanifest are the same for every stack.
 *   laravel   head-snippet.blade.php (copy the kit to public/brand/)
 * Stack comes from the brief ("stack") or the project's .web-ui-playbook.json; unknown → laravel (the original default).
 */

/** stack → { files(ctx) → [[name, text]], install } ; ctx = { c: brief.colors, brief } */
export const INTEGRATIONS = {
  laravel: {
    files: ({ c }) => [['head-snippet.blade.php', [
      '{{-- Copy this kit to public/brand/ and paste inside <head> of your layout --}}',
      `<link rel="icon" href="{{ asset('brand/favicon.ico') }}" sizes="32x32">`,
      `<link rel="icon" href="{{ asset('brand/favicon.svg') }}" type="image/svg+xml">`,
      `<link rel="apple-touch-icon" href="{{ asset('brand/png/apple-touch-icon.png') }}">`,
      `<link rel="manifest" href="{{ asset('brand/site.webmanifest') }}">`,
      `<meta name="theme-color" content="${c.primary}">`,
      `<meta property="og:image" content="{{ asset('brand/png/og-image.png') }}">`, ''].join('\n')]],
    install: 'Copy the folder to `public/brand/` in your Laravel project and paste `head-snippet.blade.php` into the `<head>` of your layout.',
  },
};

export function integrationFor(stack) {
  return INTEGRATIONS[stack] ? { stack, ...INTEGRATIONS[stack] } : { stack: 'laravel', ...INTEGRATIONS.laravel };
}

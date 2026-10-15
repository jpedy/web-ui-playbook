{{-- Fixture for `audit.mjs --contrast`. From scripts/: node audit.mjs fixtures/contrast-fa.blade.php --contrast --css ../assets/tokens.css
     Expected: 7 errors, 1 house-rule warning, 8 "could not resolve" (never counted as passed) — see each line. --}}
<!doctype html>
<html lang="fa" dir="rtl">
<body class="bg-bg text-text">
  <main class="p-6">
    <h1 class="text-h1 font-bold">عنوان اصلی صفحه</h1>                       {{-- pass: --text on --bg --}}
    <p class="text-gray-400">این متن خاکستری روشن خوانا نیست.</p>            {{-- FAIL: gray-400 on --bg --}}
    <p class="text-xs text-muted">توضیح کوچک زیر فرم</p>                       {{-- pass (muted ≥ 5.5) --}}
    <p class="text-xs text-gray-500">متن ریز با کنتراست مرزی</p>               {{-- light: house-rule warning (WCAG ok, < 5.5); dark: FAIL --}}
    <div class="bg-primary">
      <span class="text-white">ثبت‌نام</span>                                  {{-- light pass; dark FAIL — dark --primary is light: use text-primary-fg, not text-white --}}
      <span class="text-white/60">متن نیمه‌شفاف</span>                         {{-- FAIL: 60% white on primary --}}
    </div>
    <div class="bg-black/50 p-4"><p class="text-white">روی لایهٔ نیمه‌شفاف</p></div> {{-- FAIL: black/50 composited over --bg gives only 4.1:1 --}}
    <div :class="active ? 'bg-primary' : 'bg-surface'"><p>کلاس پویا</p></div> {{-- could not resolve: dynamic --}}
    <x-card><p>داخل کامپوننت</p></x-card>                                       {{-- could not resolve: component --}}
    <section class="bg-[url('/img/hero.jpg')] bg-cover"><h2 class="text-white">روی عکس</h2></section> {{-- could not resolve: image --}}
    <p class="text-brandish">رنگ ناشناخته</p>                                   {{-- could not resolve: unknown color --}}
    <p class="text-gray-900 dark:text-gray-600">حالت تاریک</p>                 {{-- light pass, dark FAIL (gray-600 on dark --bg) --}}
  </main>
</body>
</html>

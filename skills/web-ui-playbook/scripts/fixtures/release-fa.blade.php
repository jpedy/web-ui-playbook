{{-- Fixture for audit.mjs --release (scripts/selftest.mjs).
expected-release: {"release-placeholder":3,"release-fake-data":2,"release-example-phone":2}
expected-normal: {"release-fake-data":2,"release-example-phone":2}
--}}
<html lang="fa" dir="rtl">
<body>
  {{-- PLACEHOLDER: real class times --}}
  <p>ساعت کلاس: <span>[ساعت کلاس، از شما]</span></p>
  <p>شرکت نمونه — <a href="mailto:info@example.com">info</a></p>
  <p>تماس: <a href="tel:02100000000">۰۲۱-۰۰۰۰۰۰۰۰</a></p>
  <label for="m">موبایل <input id="m" type="tel" placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"></label>
  <p>[نماد اعتماد الکترونیکی]</p>
</body>
</html>

{{-- Fixture for audit.mjs --slop (checked by scripts/selftest.mjs).
expected: {"slop-filler":4,"slop-claim":6,"slop-cta":6,"slop-link-purpose":4,"slop-stat":2,"slop-testimonial":1,"slop-cards":1,"slop-blob":1,"slop-gradient-text":1,"slop-motion":3,"slop-glass":1,"slop-emoji":1,"slop-lorem":1,"slop-emdash":1,"slop-furniture":2,"slop-index-numbers":1,"slop-image-host":1,"slop-trust-seal":1,"slop-small-fa":2,"slop-pill-badge":1,"slop-hover":1,"slop-repeat-sections":1,"slop-reveal-gate":1}
claims: 9 (6 claims incl. meta description + 2 numbers + 1 quote)
--}}
<html lang="fa" dir="rtl">
<head><meta name="description" content="برترین آموزشگاه زبان با اساتید مجرب"></head>
<body class="bg-bg text-text">
<header class="sticky top-0 backdrop-blur bg-surface/80"><a href="/" class="font-bold">آموزشگاه نمونه‌ای</a></header>
<div class="fixed backdrop-blur-md bottom-4"></div>

<section class="hero relative">
  <div class="absolute -top-20 rounded-full blur-3xl bg-primary/30"></div>
  <span class="rounded-full px-3 text-xs bg-primary-subtle">جدید</span>
  <h1>برترین آموزشگاه زبان شهر</h1>
  <p>به دنیای یادگیری زبان خوش آمدید.</p>
  <p class="bg-clip-text text-transparent">متن گرادیانی</p>
  <a href="/register" class="bg-primary text-primary-fg">ثبت</a>
  <a href="/next" class="bg-primary text-primary-fg hover:bg-primary-hover">ادامه</a>
  <a href="/about" class="hover:underline">بیشتر بدانید</a>
  <p>اسکرول کنید</p>
</section>

<section class="py-16" x-intersect="shown = true">
  <h2>روشی انقلابی برای یادگیری</h2>
  <p>این متن برترین را در بدنه دارد و نباید علامت بخورد (فقط تیتر، هیرو، دکمه و توضیحات متا).</p>
  <p>دفتر ما در خیابان انقلاب است و انقلاب اسلامی هم نباید علامت بخورد.</p>
  <p>با اساتید مجرب و یادگيري سريع و آسان — مکالمه روان در ۳ ماه با تضمین قبولی.</p>
  <p>با بیش از ۱۰ سال تجربه، +۴٬۰۰۰ زبان‌آموز به ما اعتماد کرده‌اند.</p>
  <p>شهریه ترم: ۲٬۵۰۰٬۰۰۰ تومان — تقویم ۱۴۰۵ — کلاس — ساعت — شنبه</p>
  <p class="text-xs">توضیح خیلی کوچک فارسی</p>
  <p>لورم ایپسوم متن ساختگی 🚀</p>
  <span class="animate-ping inline-block size-2 rounded-full bg-success"></span>
</section>

<section class="grid md:grid-cols-3 gap-6">
  <div class="card p-6"><svg class="size-6"></svg><h3>ویژگی یک</h3><p>توضیح</p></div>
  <div class="card p-6"><svg class="size-6"></svg><h3>ویژگی دو</h3><p>توضیح</p></div>
  <div class="card p-6"><svg class="size-6"></svg><h3>ویژگی سه</h3><p>توضیح</p></div>
</section>
<section class="grid md:grid-cols-3 gap-6"><div><span>۰۱</span> مرحله</div><div><span>۰۲</span> مرحله</div></section>
<section class="grid md:grid-cols-3 gap-6"><a href="/blog/1">ادامه مطلب</a> <a href="/blog/2">ادامه مطلب</a> <a href="/blog/3"><span class="sr-only">دربارهٔ آزمون تعیین سطح: </span>ادامه مطلب</a></section>

<section>
  <blockquote>«بهترین آموزشگاهی که دیدم.» — سارا، زبان‌آموز</blockquote>
  <button type="button" @click="more = true" class="transition-all ease-in hover:bg-surface-2">نمایش بیشتر</button>
  <div class="scale-0"></div>
  <img src="https://picsum.photos/400/300" alt="" width="400" height="300">
  <img src="/img/enamad.png" alt="اینماد" width="80" height="80">
  <a href="/confirm">تایید</a>
</section>

<form action="/placement" method="post">
  <button type="submit" class="bg-primary hover:bg-primary-hover">ارسال</button>
  <button type="button" class="bg-surface hover:bg-surface-2">ادامه</button>
</form>

<section id="contact"><p>رضایت شما هدف ماست — تماس: ۰۲۱-۱۲۳۴۵۶۷۸</p></section>
<footer><p>با ما همراه باشید — برترین — ۱۰۰٪ رضایت</p></footer>
</body>
</html>

<script>
  let open = false;
  const title = 'تیتر از کد';
</script>
<!-- Fixture (selftest §3h): Svelte. Expected: "ml-2" found (physical-direction); {expressions} are not text;
     class:active / class={…} make the element dynamic (could not resolve). -->
<main class="bg-surface text-text" dir="rtl" lang="fa">
  <h1 class="ml-2">{title} صفحهٔ آزمایشی برای خواندن سوولت</h1>
  <p class:active={open} class="text-muted">متن پاراگراف با کلاس پویا</p>
</main>

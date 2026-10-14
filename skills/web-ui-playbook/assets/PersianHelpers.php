<?php

/**
 * web-ui-playbook — Persian / Iranian format helpers for Laravel (PHP 8.1+).
 *
 * UNTESTED in the authoring environment (no PHP available). It is a direct
 * port of assets/persian-helpers.js, whose logic was tested with Node.
 * Before production use, run quick checks (php artisan tinker), for example:
 *   PersianHelpers::toman(2450000)            // "۲٬۴۵۰٬۰۰۰ تومان"
 *   PersianHelpers::isValidSheba('IR062960000000100324200001') // true
 *
 * Install: copy to app/Support/PersianHelpers.php (namespace below).
 * Blade:   {{ \App\Support\PersianHelpers::toman($course->price) }}
 * Jalali:  needs ext-intl (IntlDateFormatter). Without intl, use the
 *          morilog/jalali or hekmatinasser/verta package (not from reports — verify).
 */

namespace App\Support;

final class PersianHelpers
{
    private const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    private const AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    private const EN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    /** '۰۹۱۲' / '٠٩١٢' → '0912' — run on every input before validation/storage. */
    public static function toEnglishDigits(?string $s): string
    {
        return str_replace(array_merge(self::FA, self::AR), array_merge(self::EN, self::EN), (string) $s);
    }

    /** '0912' → '۰۹۱۲' — user-facing Persian text only (never Latin tokens). */
    public static function toPersianDigits(string|int|float|null $s): string
    {
        return str_replace(array_merge(self::EN, self::AR), array_merge(self::FA, self::FA), (string) $s);
    }

    /** Normalize for search/storage: ي/ى→ی, ك→ک, strip diacritics/tatweel, ASCII digits. */
    public static function normalizeText(?string $s): string
    {
        $s = self::toEnglishDigits($s);
        $s = str_replace(["\u{064A}", "\u{0649}", "\u{0643}"], ["\u{06CC}", "\u{06CC}", "\u{06A9}"], $s);
        $s = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $s);
        $s = preg_replace('/\x{200C}{2,}/u', "\u{200C}", $s);
        return trim(preg_replace('/\s+/u', ' ', $s));
    }

    /** 1234567 → '۱٬۲۳۴٬۵۶۷' (Arabic thousands separator U+066C). */
    public static function number(int|float|string $n): string
    {
        $n = (int) preg_replace('/\D/', '', self::toEnglishDigits((string) $n));
        return self::toPersianDigits(number_format($n, 0, '.', "\u{066C}"));
    }

    /** 2450000 → '۲٬۴۵۰٬۰۰۰ تومان' */
    public static function toman(int|float|string $toman): string
    {
        return self::number($toman) . ' تومان';
    }

    /** Toman → Rial line for checkout: 2450000 → '۲۴٬۵۰۰٬۰۰۰ ریال' */
    public static function rialFromToman(int|float|string $toman): string
    {
        $n = (int) preg_replace('/\D/', '', self::toEnglishDigits((string) $toman));
        return self::number($n * 10) . ' ریال';
    }

    private const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    private const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    private const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    private const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    private const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

    private static function threeDigits(int $n): string
    {
        $parts = [];
        $h = intdiv($n, 100);
        $rest = $n % 100;
        if ($h) $parts[] = self::HUNDREDS[$h];
        if ($rest >= 10 && $rest < 20) {
            $parts[] = self::TEENS[$rest - 10];
        } else {
            $t = intdiv($rest, 10);
            $o = $rest % 10;
            if ($t) $parts[] = self::TENS[$t];
            if ($o) $parts[] = self::ONES[$o];
        }
        return implode(' و ', $parts);
    }

    /** 25000000 → 'بیست و پنج میلیون' */
    public static function words(int|string $n): string
    {
        $n = (int) preg_replace('/\D/', '', self::toEnglishDigits((string) $n));
        if ($n === 0) return 'صفر';
        $groups = [];
        $scale = 0;
        while ($n > 0 && $scale < count(self::SCALES)) {
            $chunk = $n % 1000;
            if ($chunk) {
                $w = ($chunk === 1 && $scale === 1) ? '' : self::threeDigits($chunk);
                array_unshift($groups, trim($w . ' ' . self::SCALES[$scale]));
            }
            $n = intdiv($n, 1000);
            $scale++;
        }
        return implode(' و ', $groups);
    }

    /** Jalali date string, e.g. '۲۱ مهر ۱۴۰۵' (requires ext-intl). Store dates in UTC; format only for display. */
    public static function jalali(\DateTimeInterface|string $date, string $pattern = 'd MMMM y'): string
    {
        if (! class_exists(\IntlDateFormatter::class)) {
            throw new \RuntimeException('ext-intl missing: install it or use morilog/jalali / hekmatinasser/verta.');
        }
        $dt = is_string($date) ? new \DateTimeImmutable($date) : $date;
        $fmt = new \IntlDateFormatter(
            'fa_IR@calendar=persian',
            \IntlDateFormatter::NONE,
            \IntlDateFormatter::NONE,
            'Asia/Tehran',
            \IntlDateFormatter::TRADITIONAL,
            $pattern
        );
        return self::toPersianDigits((string) $fmt->format($dt));
    }

    /** National ID (کد ملی) Mod-11 — keep as a string column (leading zeros). */
    public static function isValidNationalId(?string $raw): bool
    {
        $c = preg_replace('/[\s-]/', '', self::toEnglishDigits($raw));
        if (! preg_match('/^\d{10}$/', $c) || preg_match('/^(\d)\1{9}$/', $c)) return false;
        $sum = 0;
        for ($i = 0; $i < 9; $i++) $sum += (int) $c[$i] * (10 - $i);
        $s = $sum % 11;
        $check = (int) $c[9];
        return $s < 2 ? $check === $s : $check === 11 - $s;
    }

    /** Mobile → '09xxxxxxxxx' or '' when invalid. */
    public static function normalizeMobile(?string $raw): string
    {
        $m = preg_replace('/[\s\-()]/', '', self::toEnglishDigits($raw));
        if (str_starts_with($m, '+98')) $m = '0' . substr($m, 3);
        elseif (str_starts_with($m, '0098')) $m = '0' . substr($m, 4);
        elseif (str_starts_with($m, '98') && strlen($m) === 12) $m = '0' . substr($m, 2);
        elseif (str_starts_with($m, '9') && strlen($m) === 10) $m = '0' . $m;
        return preg_match('/^09\d{9}$/', $m) ? $m : '';
    }

    /** 16-digit Shetab card, Luhn. */
    public static function isValidCard(?string $raw): bool
    {
        $c = preg_replace('/[\s-]/', '', self::toEnglishDigits($raw));
        if (! preg_match('/^\d{16}$/', $c) || preg_match('/^(\d)\1{15}$/', $c)) return false;
        $sum = 0;
        for ($i = 0; $i < 16; $i++) {
            $v = (int) $c[$i] * ($i % 2 === 0 ? 2 : 1);
            $sum += $v > 9 ? $v - 9 : $v;
        }
        return $sum % 10 === 0;
    }

    /** Sheba: IR + 24 digits, ISO 7064 mod-97 (string arithmetic, no bcmath needed). */
    public static function isValidSheba(?string $raw): bool
    {
        $s = strtoupper(preg_replace('/[\s-]/', '', self::toEnglishDigits($raw)));
        if (! str_starts_with($s, 'IR')) $s = 'IR' . $s;
        if (! preg_match('/^IR\d{24}$/', $s)) return false;
        $rearranged = substr($s, 4) . '1827' . substr($s, 2, 2); // I=18, R=27
        $rem = 0;
        foreach (str_split($rearranged, 7) as $chunk) {
            $rem = (int) ($rem . $chunk) % 97;
        }
        return $rem === 1;
    }

    /** Laravel validation rule helpers, e.g.:
     *  'national_id' => ['required', fn($a,$v,$fail) => PersianHelpers::isValidNationalId($v) ?: $fail('کد ملی معتبر نیست.')],
     *  Normalize in the FormRequest's prepareForValidation():
     *  $this->merge(['mobile' => PersianHelpers::normalizeMobile($this->mobile)]);
     */
}

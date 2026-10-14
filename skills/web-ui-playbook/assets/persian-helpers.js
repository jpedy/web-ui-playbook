/**
 * web-ui-playbook — Persian / Iranian format helpers (zero dependencies).
 * Browser (ES module) or Node 18+. Bundle it with Vite; never load from a CDN.
 *
 *   import { toPersianDigits, formatToman, isValidIranMobile } from './persian-helpers.js';
 *
 * Without a bundler: <script type="module" src="/js/persian-helpers.js"></script>
 * also exposes window.PersianHelpers.
 *
 * Rules (references/persian-rtl.md §5, iran-market.md §6):
 *  - Normalize user input to ASCII digits BEFORE validating or storing.
 *  - Show Persian digits to users; store/transmit ASCII.
 *  - Library alternative: @persian-tools/persian-tools (MIT).
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** '۰۹۱۲' / '٠٩١٢' / '0912' → '0912' */
export function toEnglishDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** '0912' / '٠٩١٢' → '۰۹۱۲' (use only on user-facing Persian text, never on Latin tokens) */
export function toPersianDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[٠-٩]/g, (d) => FA_DIGITS[d.charCodeAt(0) - 0x0660])
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Normalize Persian text for search/storage: Arabic ي/ى/ك → ی/ک, strip diacritics & tatweel, ASCII digits. */
export function normalizePersianText(input) {
  if (!input) return '';
  return toEnglishDigits(input)
    .replace(/[يى]/g, 'ی') // Arabic Yeh / Alef Maksura → Farsi Yeh
    .replace(/ك/g, 'ک')         // Arabic Kaf → Keheh
    .replace(/[ً-ٰٟ]/g, '') // diacritics
    .replace(/ـ/g, '')                // tatweel
    .replace(/‌{2,}/g, '‌')      // collapse ZWNJ
    .replace(/\s+/g, ' ')
    .trim();
}

/** Search key: also treats ZWNJ and space as the same. */
export function searchKey(input) {
  return normalizePersianText(input).replace(/‌/g, ' ').toLowerCase();
}

/** Persian collation for sorting lists: arr.sort(persianCompare) */
export const persianCompare = new Intl.Collator('fa-IR').compare;

/** 1234567 → '۱٬۲۳۴٬۵۶۷' (Persian digits + U+066C separator) */
export function formatNumberFa(n, options = {}) {
  const num = typeof n === 'string' ? Number(toEnglishDigits(n).replace(/[^\d.-]/g, '')) : n;
  if (!Number.isFinite(num)) return '';
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0, ...options }).format(num);
}

/** 2450000 → '۲٬۴۵۰٬۰۰۰ تومان' */
export function formatToman(toman) {
  const s = formatNumberFa(toman);
  return s ? `${s} تومان` : '';
}

/** Rial equivalent line for checkout: 2450000 → '۲۴٬۵۰۰٬۰۰۰ ریال' */
export function formatRialFromToman(toman) {
  const s = formatNumberFa(Number(toEnglishDigits(String(toman)).replace(/[^\d]/g, '')) * 10);
  return s ? `${s} ریال` : '';
}

/** For live money inputs: '2450000' or '۲۴۵۰۰۰۰' → '۲٬۴۵۰٬۰۰۰' (digits only kept) */
export function formatAmountInput(raw) {
  const digits = toEnglishDigits(raw).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits ? formatNumberFa(Number(digits)) : '';
}

/** Parse a displayed amount back to an integer: '۲٬۴۵۰٬۰۰۰' → 2450000 */
export function parseAmount(display) {
  const digits = toEnglishDigits(display).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

/* ---------- Number to Persian words (for "معادل به حروف") ---------- */
const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function threeDigitsToWords(n) {
  const parts = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10]);
  else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t) parts.push(TENS[t]);
    if (o) parts.push(ONES[o]);
  }
  return parts.join(' و ');
}

/** 25000000 → 'بیست و پنج میلیون' ; 0 → 'صفر' (integers up to 999 trillion) */
export function numberToPersianWords(input) {
  let n = typeof input === 'string' ? Number(toEnglishDigits(input).replace(/\D/g, '')) : Math.floor(input);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n === 0) return 'صفر';
  const groups = [];
  let scale = 0;
  while (n > 0 && scale < SCALES.length) {
    const chunk = n % 1000;
    if (chunk) {
      // 1000 reads "هزار" (not "یک هزار"); 1,000,000 reads "یک میلیون"
      const words = chunk === 1 && scale === 1 ? '' : threeDigitsToWords(chunk);
      groups.unshift([words, SCALES[scale]].filter(Boolean).join(' '));
    }
    n = Math.floor(n / 1000);
    scale++;
  }
  return groups.join(' و ');
}

/** 25000000 → 'بیست و پنج میلیون تومان' */
export function tomanInWords(toman) {
  const w = numberToPersianWords(toman);
  return w ? `${w} تومان` : '';
}

/* ---------- Dates (Jalali display; store UTC ISO strings) ---------- */
/**
 * formatJalali(new Date()) → '۲۱ مهر ۱۴۰۵'
 * style: 'long' | 'medium' | 'short' | 'full' ; withTime adds '، ۱۸:۳۰'
 */
export function formatJalali(date, { style = 'long', withTime = false } = {}) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const opts = { dateStyle: style, timeZone: 'Asia/Tehran' };
  if (withTime) Object.assign(opts, { timeStyle: 'short', hourCycle: 'h23' });
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', opts).format(d);
}

/** Jalali parts as numbers: { year: 1405, month: 7, day: 21 } (Asia/Tehran) */
export function jalaliParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Tehran',
  }).formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
/** Saturday-first week (render right→left in RTL grids) */
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
export const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
/** Class cadences */
export const EVEN_DAYS = ['شنبه', 'دوشنبه', 'چهارشنبه'];   // روزهای زوج
export const ODD_DAYS = ['یکشنبه', 'سه‌شنبه', 'پنج‌شنبه'];   // روزهای فرد

/* ---------- Validation (normalize first) ---------- */

/** National ID (کد ملی), Mod-11. Keep as a 10-char string. */
export function isValidNationalId(raw) {
  const code = toEnglishDigits(raw).replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
  const check = Number(code[9]);
  const s = code.slice(0, 9).split('').reduce((acc, d, i) => acc + Number(d) * (10 - i), 0) % 11;
  return s < 2 ? check === s : check === 11 - s;
}

/** Iranian mobile → '09xxxxxxxxx' or '' if invalid. Accepts +98 / 0098 / 98 / 0 / none, any digit set. */
export function normalizeIranMobile(raw) {
  let m = toEnglishDigits(raw).replace(/[\s\-()]/g, '');
  if (m.startsWith('+98')) m = '0' + m.slice(3);
  else if (m.startsWith('0098')) m = '0' + m.slice(4);
  else if (m.startsWith('98') && m.length === 12) m = '0' + m.slice(2);
  else if (m.startsWith('9') && m.length === 10) m = '0' + m;
  return /^09\d{9}$/.test(m) ? m : '';
}
export const isValidIranMobile = (raw) => normalizeIranMobile(raw) !== '';

/** 16-digit bank card (Shetab), Luhn. */
export function isValidCardNumber(raw) {
  const card = toEnglishDigits(raw).replace(/[\s-]/g, '');
  if (!/^\d{16}$/.test(card) || /^(\d)\1{15}$/.test(card)) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let v = Number(card[i]) * (i % 2 === 0 ? 2 : 1);
    if (v > 9) v -= 9;
    sum += v;
  }
  return sum % 10 === 0;
}

/** '6037991234567890' → '6037 9912 3456 7890' (display in an LTR span) */
export function formatCardNumber(raw) {
  return toEnglishDigits(raw).replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** BIN → bank name (partial list from the report — ⏱ verify/extend before relying) */
const BINS = { '603799': 'بانک ملی', '610433': 'بانک ملت', '621986': 'بانک سامان', '502229': 'بانک پاسارگاد' };
export function bankFromCard(raw) {
  return BINS[toEnglishDigits(raw).replace(/\D/g, '').slice(0, 6)] || '';
}

/** Sheba / IBAN: 'IR' + 24 digits, ISO 7064 mod-97. Accepts with or without 'IR'. */
export function isValidSheba(raw) {
  const cleaned = toEnglishDigits(raw).replace(/[\s-]/g, '').toUpperCase();
  const sheba = cleaned.startsWith('IR') ? cleaned : `IR${cleaned}`;
  if (!/^IR\d{24}$/.test(sheba)) return false;
  const rearranged = `${sheba.slice(4)}1827${sheba.slice(2, 4)}`; // I=18, R=27
  return BigInt(rearranged) % 97n === 1n;
}

/** Postal code: plain 10-digit check (the report's stricter regex is unverified). */
export function isValidPostalCode(raw) {
  return /^\d{10}$/.test(toEnglishDigits(raw).replace(/[\s-]/g, ''));
}

/* ---------- OTP countdown text: 119 → '۰۱:۵۹' ---------- */
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return toPersianDigits(`${mm}:${ss}`);
}

if (typeof window !== 'undefined') {
  window.PersianHelpers = {
    toEnglishDigits, toPersianDigits, normalizePersianText, searchKey, persianCompare,
    formatNumberFa, formatToman, formatRialFromToman, formatAmountInput, parseAmount,
    numberToPersianWords, tomanInWords, formatJalali, jalaliParts, JALALI_MONTHS, WEEKDAYS,
    WEEKDAYS_SHORT, EVEN_DAYS, ODD_DAYS, isValidNationalId, normalizeIranMobile, isValidIranMobile,
    isValidCardNumber, formatCardNumber, bankFromCard, isValidSheba, isValidPostalCode, formatCountdown,
  };
}

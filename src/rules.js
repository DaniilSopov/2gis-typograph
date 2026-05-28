const NBSP = ' ';
const NNBSP = ' ';
const WJ = '⁠';
const MDASH = '—';
const NDASH = '–';

export const rules = [
  // ── dash group ─────────────────────────────────────────────────────────────

  // Step 1: numeric/time RANGES — both sides same type → compact en-dash
  {
    id: 'dash-numeric',
    name: 'Тире в диапазонах',
    description: 'Числовой или временной диапазон → короткое тире (–) без пробелов',
    group: 'dash',
    apply(text) {
      // Time–time: 6:00–9:00, 6:00 - 9:00, 6:00— 9:00, 6:00 –9:00, etc.
      text = text.replace(
        /(\d{1,2}:\d{2})[ \t]*[-–—][ \t]*(\d{1,2}:\d{2})/g,
        `$1${NDASH}$2`
      );
      // Number–number: 10-20, 450 — 500, 2020–2025
      // (?<![:\d]) prevents matching trailing digits of a time value (21:00…)
      text = text.replace(
        /(?<![:\d])(\d+(?:[.,]\d+)?)[ \t]*[-–—][ \t]*(\d+(?:[.,]\d+)?)(?=[^\d]|$)/g,
        `$1${NDASH}$2`
      );
      // Abbreviated ranges: пн–пт, янв–мар, etc.
      const ABBR = '(?:пн|вт|ср|чт|пт|сб|вс|янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)';
      text = text.replace(
        new RegExp(`(?<![а-яёА-ЯЁ])(${ABBR})[ \\t]*[-–—][ \\t]*(${ABBR})(?![а-яёА-ЯЁ])`, 'gi'),
        `$1${NDASH}$2`
      );
      return text;
    },
  },

  // Step 2: EVERYTHING ELSE — any dash in separator role → em-dash with NBSP
  {
    id: 'dash-sentence',
    name: 'Длинное тире',
    description: 'Любой знак тире/дефис как разделитель → длинное тире (—) с NBSP',
    group: 'dash',
    apply(text) {
      return text.replace(
        /([^\-–—\s])[ \t]*[-–—]+[ \t]*(?=[^\-–—\s])/g,
        (match, before, offset, str) => {
          const dashPart    = match.slice(before.length);
          const hasSpace    = /[ \t]/.test(dashPart);
          const dashOnly    = dashPart.trim();
          const afterOffset = offset + match.length;
          const afterChar   = str[afterOffset] ?? '';

          // ① Compound word: letter-hyphen-letter, no spaces
          //    красно-синий, пол-лимона, IT-компания, экс-президент
          if (dashOnly === '-' && !hasSpace &&
              /[а-яёА-ЯЁa-zA-Z]$/.test(before) && /^[а-яёА-ЯЁa-zA-Z]/.test(afterChar)) {
            return match;
          }

          // ② Ordinals and digit+Cyrillic compounds: 1-й, 21-го, 100-летие
          if (dashOnly === '-' && !hasSpace &&
              /\d$/.test(before) && /^[а-яёА-ЯЁ]/.test(afterChar)) {
            return match;
          }

          // ③ Compact en-dash: preserve if it's a range (from dash-numeric)
          //    or a geographic/word route (Москва–Петербург)
          if (dashOnly === '–' && !hasSpace) {
            // Geographic / word routes: letter–letter
            if (/[а-яёА-ЯЁa-zA-Z]$/.test(before)) return match;

            // Numeric: same type on both sides → range, keep
            if (/\d$/.test(before) && /^\d/.test(afterChar)) {
              let ls = offset;
              while (ls > 0 && !/[\s\-–—]/.test(str[ls - 1])) ls--;
              const leftToken = str.slice(ls, offset + before.length);
              let re = afterOffset;
              while (re < str.length && !/[\s\-–—]/.test(str[re])) re++;
              const rightToken = str.slice(afterOffset, re);
              if (leftToken.includes(':') === rightToken.includes(':')) return match;
            }
          }

          // ④ Code/reference: letter-hyphen-digit, no spaces (ТЗ-2847, AB-123)
          if (dashOnly === '-' && !hasSpace &&
              /[а-яёА-ЯЁa-zA-Z]$/.test(before) && /^\d/.test(afterChar)) {
            return match;
          }

          // All other cases → em-dash with NBSP on the left
          return `${before}${NBSP}${MDASH} `;
        }
      );
    },
  },

  // ── quotes group ────────────────────────────────────────────────────────────
  {
    id: 'quotes-double',
    name: 'Двойные кавычки → ёлочки',
    description: 'Прямые " " → «ёлочки», вложенные → „лапки"',
    group: 'quotes',
    apply(text) {
      let result = '';
      let depth = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '”') {
          const prevCh = i > 0 ? text[i - 1] : null;
          const nextCh = i < text.length - 1 ? text[i + 1] : null;
          // Inch/foot mark: digit before and no word char after → keep as-is
          if (/\d/.test(prevCh) && (nextCh === null || !/[\wа-яёА-ЯЁ”]/.test(nextCh))) {
            result += ch;
            continue;
          }
          const prevIsWordEnd = prevCh !== null && /[\wа-яёА-ЯЁ\)\]»”']/.test(prevCh);
          if (depth > 0 && prevIsWordEnd) {
            depth--;
            result += depth === 0 ? '»' : '”';
          } else {
            result += depth === 0 ? '«' : '„';
            depth++;
          }
        } else {
          result += ch;
        }
      }
      return result;
    },
  },
  {
    id: 'quotes-single',
    name: 'Одинарные кавычки',
    description: "Прямые ' ' → «ёлочки» (если не апостроф внутри слова)",
    group: 'quotes',
    apply(text) {
      return text.replace(/(^|[\s(«„])'([^']+)'([\s)»"]|$)/g, '$1«$2»$3');
    },
  },

  // ── spacing group ───────────────────────────────────────────────────────────
  {
    id: 'spacing-after-punct',
    name: 'Пробел после знака препинания',
    description: 'Точка перед заглавной кириллицей без пробела → пробел (конец предложения); запятая перед словом без пробела → пробел',
    group: 'spacing',
    apply(text) {
      // Period before Cyrillic uppercase without space → sentence boundary
      // Requires 2+ chars before period to exclude single-letter initials (А.Б.)
      text = text.replace(
        /([а-яёА-ЯЁa-zA-Z0-9]{2,})\.(?=[А-ЯЁ])/g,
        '$1. '
      );
      // Comma before letter without space → add space
      // Excludes digit,digit (decimal comma: 1,5) since second group requires letter
      text = text.replace(
        /([а-яёА-ЯЁa-zA-Z0-9]),([а-яёА-ЯЁa-zA-Z])/g,
        '$1, $2'
      );
      return text;
    },
  },

  // ── nbsp group ──────────────────────────────────────────────────────────────
  {
    id: 'phone-numbers',
    name: 'Номера телефонов',
    description: 'Нормализация телефонных номеров к формату +7 (XXX) XXX-XX-XX',
    group: 'nbsp',
    apply(text) {
      // Separators: whitespace (incl. NBSP/NNBSP), hyphen, parens, dot, en-dash, em-dash
      // En- and em-dashes may appear because dash rules ran before this rule
      const isSep = c => /[\s\-(). –—]/.test(c);
      let result = '';
      let i = 0;

      while (i < text.length) {
        const ch = text[i];
        const isPlus = ch === '+';
        // Russian: starts with 7 or 8, not preceded by + or digit
        const isRu = (ch === '7' || ch === '8') && (i === 0 || !/[+\d]/.test(text[i - 1]));

        if (isPlus || isRu) {
          let j = isPlus ? i + 1 : i;

          // Scan forward: collect digits and separators
          while (j < text.length && (/\d/.test(text[j]) || isSep(text[j]))) {
            j++;
          }

          // Trim trailing separators
          const jMin = isPlus ? i + 1 : i;
          while (j > jMin && isSep(text[j - 1])) {
            j--;
          }

          const candidate = text.slice(i, j);
          const digits = candidate.replace(/\D/g, '');

          // Russian: exactly 11 digits starting with 7 or 8
          if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
            const area = digits.slice(1, 4);
            const n1   = digits.slice(4, 7);
            const n2   = digits.slice(7, 9);
            const n3   = digits.slice(9, 11);
            result += '+7 (' + area + ') ' + n1 + '‑' + n2 + '‑' + n3;
            i = j;
            continue;
          }

          // International: has +, 10-15 digits, not Russian
          if (isPlus && digits.length >= 10 && digits.length <= 15) {
            result += '+' + digits;
            i = j;
            continue;
          }
        }

        result += text[i];
        i++;
      }

      return result;
    },

  },
    {
    id: 'number-thousands',
    name: 'Разделитель тысяч',
    description: 'Числа от 5 цифр → неразрывный пробел (U+00A0) как разделитель тысяч',
    group: 'nbsp',
    apply(text) {
      text = text.replace(/(?<![+\d№])(\d{1,3})( \d{3})+(?!\d)/g, match =>
        match.replace(/ /g, '')
      );
      return text.replace(/(?<![+\d№])\d{5,}(?!\d)/g, num =>
        num.replace(/(\d)(?=(\d{3})+$)/g, `$1${NBSP}`)
      );
    },
  },
  {
    id: 'nbsp-units',
    name: 'NBSP перед единицами',
    description: 'Число + единица измерения → NBSP между ними',
    group: 'nbsp',
    apply(text) {
      const units = [
        '₽', '€', '%',
        'км/ч', 'м/с',
        'суток', 'сутки', 'часов', 'минут', 'метров', 'рублей', 'человек',
        'недели', 'месяцев',
        'часа', 'часу', 'минуты', 'минуте', 'метра',
        'дней', 'дня', 'рубля', 'людей',
        'квт', 'мвт', 'мгц', 'ггц', 'нед', 'мес',
        'км', 'мм', 'см', 'дм', 'кг', 'мл',
        'гб', 'мб', 'кб', 'тб', 'rem',
        'м', 'г', 'ч', 'л', 'т', 'шт', 'год', 'лет', 'вт', 'гц', 'руб', 'дн',
        'px', 'dp', 'pt', 'sp', 'em', 'мин',
      ].sort((a, b) => b.length - a.length);
      const pattern = units.join('|');
      const re = new RegExp(`(\\d) (${pattern})(?![а-яёА-ЯЁa-zA-Z])`, 'gi');
      return text.replace(re, `$1${NBSP}$2`);
    },
  },
  {
    id: 'nbsp-caps-code',
    name: 'NBSP в кодах типа RAL, RGB',
    description: 'Аббревиатура из 2–6 заглавных латинских букв перед числом → NBSP (RAL 7021, RGB 255)',
    group: 'nbsp',
    apply(text) {
      return text.replace(/([A-Z]{2,6}) (?=\d)/g, `$1${NBSP}`);
    },
  },
  {
    id: 'nbsp-number-word',
    name: 'NBSP между числом и словом',
    description: 'Цифра + кириллическое слово → NBSP между ними',
    group: 'nbsp',
    apply(text) {
      return text.replace(/(?<!\d{1,2}:\d)(?<!‑\d)(\d) (?!(?:или|либо)(?![а-яёА-ЯЁ]))(?=[А-ЯЁа-яё]{3})/g, `$1${NBSP}`);
    },
  },
  {
    id: 'nbsp-short-token',
    name: 'NBSP после коротких слов',
    description: 'Предлог/союз ≤2 букв → NBSP после него',
    group: 'nbsp',
    apply(text) {
      return text.replace(
        /(?<![а-яёА-ЯЁa-zA-Z\d\/\-\.\xA0])([а-яёa-zА-ЯЁA-Z]{1,2}|[а-яёa-zА-ЯЁA-Z]{1,2}[.,;:!?]|[.,;:!?][а-яёa-zА-ЯЁA-Z]{1,2}) (?=\S)/g,
        (match, token) => `${token}${NBSP}`
      );
    },
  },
  {
    id: 'nbsp-numero',
    name: 'NBSP после №',
    description: 'После знака № ставится неразрывный пробел (обычный заменяется, отсутствующий добавляется)',
    group: 'nbsp',
    apply(text) {
      return text.replace(/№ ?(?=\S)/g, `№${NBSP}`)
    },
  },
  {
    id: 'nbsp-abbr',
    name: 'NBSP после аббревиатур',
    description: 'Сокращения 3+ букв с точкой перед числом (корп., стр., пер. и др.) → NBSP',
    group: 'nbsp',
    apply(text) {
      return text.replace(/([а-яёА-ЯЁ]{3,})\. (?=\d)/g, `$1.${NBSP}`)
    },
  },
  {
    id: 'nbsp-emoji',
    name: 'NBSP после эмодзи',
    description: 'После эмодзи ставится NBSP перед следующим словом',
    group: 'nbsp',
    apply(text) {
      return text.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})(️?) (?=\S)/gu, `$1$2${NBSP}`);
    },
  },
  {
    id: 'capitalize-after-emoji',
    name: 'Заглавная после эмодзи',
    description: 'Первое слово после эмодзи пишется с заглавной буквы',
    group: 'nbsp',
    apply(text) {
      return text.replace(
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})(️?)[  ]([а-яёa-z])/gu,
        (_, emoji, vs, char) => `${emoji}${vs}${NBSP}${char.toUpperCase()}`
      );
    },
  },

  // ── zero-width group ────────────────────────────────────────────────────────
  {
    id: 'word-joiner-slash',
    name: 'Word Joiner после / и –',
    description: 'После / (перед коротким сегментом ≤3 симв.) и после – в числовых диапазонах добавляется Word Joiner (U+2060)',
    group: 'zero-width',
    apply(text) {
      text = text.replace(/\/(?=[\p{L}\d])/gu, `/${WJ}`);
      // Numeric ranges: prevent line break after en-dash
      text = text.replace(/–(?=\d)/g, `–${WJ}`);
      return text;
    },
  },
];

function sanitize(text) {
  return text
    // Remove zero-width characters (WJ, ZWSP, ZWJ, ZWNJ, BOM, soft hyphen)
    .replace(/[⁠​‌‍﻿­]/g, '')
    // Normalize NBSP and other typographic spaces → regular space
    .replace(/[            　 ]/g, ' ')
    // Collapse multiple spaces/tabs into one (preserve newlines)
    .replace(/[ \t]{2,}/g, ' ')
    // Remove spaces at the start/end of each line
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    // Normalize smart/curly double quotes → straight double quote
    .replace(/[“”„‟]/g, '"')
}

const URL_RE = /https?:\/\/\S+|(?<![а-яёА-ЯЁa-zA-Z\d])[\w-]+(?:\.[\w-]+)+\/\S*/gi;
// \x02 / \x03 are control chars that never appear in normal text
const phFor  = i => `\x02URL${i}\x03`;
const PH_RE  = /\x02URL(\d+)\x03/g;

export function applyRules(text) {
  if (!text || !text.trim()) return text;

  // Step 1 — pull out URLs so rules never touch them
  const urls = [];
  const masked = text.replace(URL_RE, match => {
    // Keep trailing sentence punctuation outside the placeholder
    const tail = match.match(/[.,;!?]+$/)?.[0] ?? '';
    urls.push(tail ? match.slice(0, -tail.length) : match);
    return phFor(urls.length - 1) + tail;
  });

  // Step 2 — sanitize + apply all typographic rules
  const processed = rules.reduce((cur, rule) => rule.apply(cur), sanitize(masked));

  // Step 3 — restore original URLs
  return urls.length === 0
    ? processed
    : processed.replace(PH_RE, (_, i) => urls[+i]);
}

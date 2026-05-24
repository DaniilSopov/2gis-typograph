const NBSP = ' ';
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
        if (ch === '"') {
          const prevCh = i > 0 ? text[i - 1] : null;
          const prevIsWordEnd = prevCh !== null && /[\wа-яёА-ЯЁ\)\]»"']/.test(prevCh);
          if (depth > 0 && prevIsWordEnd) {
            depth--;
            result += depth === 0 ? '»' : '"';
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

  // ── nbsp group ──────────────────────────────────────────────────────────────
  {
    id: 'nbsp-units',
    name: 'NBSP перед единицами',
    description: 'Число + единица измерения → NBSP между ними',
    group: 'nbsp',
    apply(text) {
      const units = [
        '₽', '%',
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
    id: 'nbsp-short-token',
    name: 'NBSP после коротких слов',
    description: 'Предлог/союз ≤2 букв → NBSP после него',
    group: 'nbsp',
    apply(text) {
      return text.replace(
        /(?:^|(?<=\s))([а-яёa-zА-ЯЁA-Z]{1,2}|[а-яёa-zА-ЯЁA-Z]{1,2}[.,;:!?]|[.,;:!?][а-яёa-zА-ЯЁA-Z]{1,2}) (?=\S)/g,
        (match, token) => `${token}${NBSP}`
      );
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
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})(️?)[  ]([а-яёa-z])/gu,
        (_, emoji, vs, char) => `${emoji}${vs}${NBSP}${char.toUpperCase()}`
      );
    },
  },

  // ── zero-width group ────────────────────────────────────────────────────────
  {
    id: 'word-joiner-slash',
    name: 'Word Joiner после /',
    description: 'После / добавляется Word Joiner (U+2060) — предотвращает перенос',
    group: 'zero-width',
    apply(text) {
      return text.replace(/\/(?!⁠)/g, `/${WJ}`);
    },
  },
];

export function applyRules(text) {
  if (!text || !text.trim()) return text;
  return rules.reduce((current, rule) => rule.apply(current), text);
}

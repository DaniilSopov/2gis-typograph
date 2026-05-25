const NBSP = ' ';
const WJ = '⁠';
const MDASH = '—';
const NDASH = '–';

// Map characters to their highlight group
const CHAR_GROUP = {
  [NBSP]: 'nbsp',
  ' ': 'nbsp',
  [WJ]: 'zero-width',
  '⁡': 'zero-width',
  '⁢': 'zero-width',
  '⁣': 'zero-width',
  '​': 'zero-width',
  [MDASH]: 'dash-em',
  [NDASH]: 'dash-en',
  '«': 'quotes',
  '»': 'quotes',
  '„': 'quotes',
  '“': 'quotes',
  '”': 'quotes',
};

// Invisible characters that need a visual dot marker
const INVISIBLE = new Set([NBSP, ' ', WJ, '⁡', '⁢', '⁣', '​']);

/**
 * Compute LCS-based character diff between original and processed strings.
 * Returns array of segments: { text, group, invisible, changed }
 * where group is one of 'nbsp' | 'zero-width' | 'quotes' | 'dash' | null
 */
export function computeDiff(original, processed) {
  if (original === processed) {
    return [{ text: processed, group: null, changed: false }];
  }

  // Build segments by comparing char-by-char with a simple LCS diff
  const segments = [];
  const ops = lcsEditOps(original, processed);

  let buf = '';
  let bufChanged = false;
  let bufGroup = null;

  function flush() {
    if (buf.length > 0) {
      segments.push({
        text: buf,
        group: bufGroup,
        changed: bufChanged,
        invisible: bufChanged && bufGroup ? INVISIBLE.has(buf[0]) : false,
      });
      buf = '';
      bufChanged = false;
      bufGroup = null;
    }
  }

  for (const op of ops) {
    if (op.type === 'equal') {
      // If we were building a changed segment, flush it
      if (bufChanged) flush();
      buf += op.char;
      bufChanged = false;
      bufGroup = null;
    } else if (op.type === 'insert') {
      const g = CHAR_GROUP[op.char] || 'changed';
      if (bufChanged && bufGroup === g) {
        buf += op.char;
      } else {
        flush();
        buf = op.char;
        bufChanged = true;
        bufGroup = g;
      }
    }
    // 'delete' ops: original chars that were removed — skip them (don't show)
  }
  flush();

  return segments;
}

/**
 * Produces edit operations (equal/insert/delete) from LCS of two strings.
 * Uses Myers diff for reasonable performance on typical text sizes.
 */
function lcsEditOps(a, b) {
  const n = a.length;
  const m = b.length;

  if (n === 0) return b.split('').map(c => ({ type: 'insert', char: c }));
  if (m === 0) return a.split('').map(c => ({ type: 'delete', char: c }));

  // Simple DP-based LCS then traceback
  // For large texts this could be slow; typography texts are typically short
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: 'equal', char: b[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'insert', char: b[j - 1] });
      j--;
    } else {
      ops.push({ type: 'delete', char: a[i - 1] });
      i--;
    }
  }
  ops.reverse();
  return ops;
}

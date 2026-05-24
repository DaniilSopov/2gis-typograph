/**
 * Output formatting module.
 * Currently supports mode='unicode' only.
 * Future modes: 'html-entities', 'escape-sequences' (for iOS/Android devs).
 */

export function formatOutput(text, mode = 'unicode') {
  switch (mode) {
    case 'unicode':
      return text;
    // Reserved for future implementation:
    // case 'html-entities': return toHtmlEntities(text);
    // case 'escape-sequences': return toEscapeSequences(text);
    default:
      return text;
  }
}

import styles from './SpellcheckOverlay.module.css'

export default function SpellcheckOverlay({ text, errors, scrollTop }) {
  if (!errors.length) return null

  const parts = []
  let cursor = 0

  const sorted = [...errors].sort((a, b) => a.pos - b.pos)

  for (const err of sorted) {
    if (err.pos > cursor) {
      parts.push(<span key={`t${cursor}`}>{text.slice(cursor, err.pos)}</span>)
    }
    const word = text.slice(err.pos, err.pos + err.len)
    parts.push(
      <mark key={`e${err.pos}`} className={styles.error}>
        {word}
      </mark>
    )
    cursor = err.pos + err.len
  }

  if (cursor < text.length) {
    parts.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>)
  }

  return (
    <div
      className={styles.overlay}
      style={{ transform: `translateY(${-scrollTop}px)` }}
      aria-hidden="true"
    >
      {parts}
    </div>
  )
}

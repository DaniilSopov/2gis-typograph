import styles from './SpellcheckOverlay.module.css'

function buildSegments(text, errors) {
  const sorted = [...errors]
    .filter(e => e.pos >= 0 && e.pos + e.len <= text.length)
    .sort((a, b) => a.pos - b.pos)

  const out = []
  let pos = 0
  let key = 0

  for (const e of sorted) {
    if (e.pos < pos) continue
    if (e.pos > pos) out.push(<span key={key++}>{text.slice(pos, e.pos)}</span>)
    out.push(
      <span key={key++} className={styles.error}>
        {text.slice(e.pos, e.pos + e.len)}
      </span>
    )
    pos = e.pos + e.len
  }

  if (pos < text.length) out.push(<span key={key++}>{text.slice(pos)}</span>)
  return out
}

export default function SpellcheckOverlay({ text, errors, scrollTop = 0 }) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div style={{ transform: `translateY(${-scrollTop}px)` }}>
        {errors.length ? buildSegments(text, errors) : text}
      </div>
    </div>
  )
}

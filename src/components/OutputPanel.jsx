import { useState, useCallback, useEffect, useRef } from 'react'
import Legend from './Legend.jsx'
import styles from './OutputPanel.module.css'

const TYPO_CHAR_GROUP = {
  ' ': 'nbsp',
  '⁠': 'zero-width',
  '​': 'zero-width',
  '«': 'quotes', '»': 'quotes',
  '„': 'quotes', '"': 'quotes', '"': 'quotes',
  '—': 'dash-em', '–': 'dash-en',
}

const NBSP_CHAR = ' '
const ZW_CHARS = new Set(['⁠', '​', '⁡', '⁢', '⁣'])

function splitAtTypoChars(text) {
  const parts = []
  let plain = ''
  for (const char of [...text]) {
    const group = TYPO_CHAR_GROUP[char]
    if (group) {
      if (plain) { parts.push({ text: plain, group: null }); plain = '' }
      parts.push({ text: char, group })
    } else {
      plain += char
    }
  }
  if (plain) parts.push({ text: plain, group: null })
  return parts
}

function CharMark({ char, group }) {
  const isNbsp = char === NBSP_CHAR
  const isZw = ZW_CHARS.has(char)

  const cls = [
    styles.highlight,
    styles[`group_${group}`],
    isNbsp ? styles.nbspMark : null,
    isZw ? styles.zwMark : null,
  ].filter(Boolean).join(' ')

  let title = undefined
  if (isNbsp) title = 'Неразрывный пробел (U+00A0)'
  if (char === '⁠') title = 'Word Joiner (U+2060)'

  return (
    <mark className={cls} data-group={group} title={title}>
      {char}
    </mark>
  )
}

function Segment({ segment, highlight }) {
  if (!highlight || !segment.changed) {
    const parts = splitAtTypoChars(segment.text)
    if (!highlight || (parts.length === 1 && !parts[0].group)) {
      return <span>{segment.text}</span>
    }
    return (
      <>
        {parts.map((p, i) =>
          p.group
            ? <CharMark key={i} char={p.text} group={p.group} />
            : <span key={i}>{p.text}</span>
        )}
      </>
    )
  }

  return (
    <>
      {[...segment.text].map((char, i) => {
        const group = TYPO_CHAR_GROUP[char] || segment.group
        return <CharMark key={i} char={char} group={group} />
      })}
    </>
  )
}

function IconCheck({ active }) {
  return active ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1DB93C" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="#d4d4d4" strokeWidth="1.5" />
    </svg>
  )
}

function IconCopy({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12.25 8C14.31 8 16 9.69 16 11.75V18.25C16 20.31 14.31 22 12.25 22H5.75C3.69 22 2 20.31 2 18.25V11.75C2 9.69 3.69 8 5.75 8H12.25ZM4.7002 9.7002C4.1502 9.7002 3.7002 10.1502 3.7002 10.7002V19.2998C3.7002 19.8498 4.1502 20.2998 4.7002 20.2998H13.2998C13.8498 20.2998 14.2998 19.8498 14.2998 19.2998V10.7002C14.2998 10.1502 13.8498 9.7002 13.2998 9.7002H4.7002ZM18.25 2C20.31 2 22 3.69 22 5.75V12.25C22 14.31 20.31 16 18.25 16H17.7002V14.2998H19.2998C19.8498 14.2998 20.2998 13.8498 20.2998 13.2998V4.7002C20.2998 4.1502 19.8498 3.7002 19.2998 3.7002H10.7002C10.1502 3.7002 9.7002 4.1502 9.7002 4.7002V6.2998H8V5.75C8 3.69 9.69 2 11.75 2H18.25Z" fill={color} />
    </svg>
  )
}

function IconCheckCircle({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92493 23 1 18.0751 1 12C1 5.92487 5.92493 1 12 1ZM15.9502 7L10.9697 15.5996L8.90039 12H6.94043L9.24023 16C10.0102 17.3299 11.9302 17.33 12.7002 16L17.8604 7H15.9502Z" fill={color} />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 0C12.418 0 16 3.581 16 8C16 12.418 12.418 16 8 16C3.582 16 0 12.418 0 8C0 3.582 3.582 0 8 0ZM6 6V7.40039H8.17383L6.93945 12H8.38672L9.49219 7.88965C9.7479 6.93778 9.02984 6 8.04297 6H6ZM10 3C9.447 3 9 3.448 9 4C9 4.552 9.447 5 10 5C10.553 5 11 4.552 11 4C11 3.448 10.553 3 10 3Z" fill="#b8b8b8" />
    </svg>
  )
}

export default function OutputPanel({ segments, processed, highlightEnabled, onToggleHighlight }) {
  const [copied, setCopied] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const infoWrapperRef = useRef(null)

  useEffect(() => {
    if (!showLegend) return
    function handleClick(e) {
      if (infoWrapperRef.current && !infoWrapperRef.current.contains(e.target)) {
        setShowLegend(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showLegend])

  const handleCopy = useCallback(async () => {
    if (!processed) return
    try {
      await navigator.clipboard.writeText(processed)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = processed
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [processed])

  const hasResult = segments !== null
  const canCopy = !!processed

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.label}>Результат</span>
        <div className={styles.headerRight}>
          <button
            className={styles.checkboxRow}
            onClick={onToggleHighlight}
            aria-label={highlightEnabled ? 'Отключить подсветку' : 'Включить подсветку'}
          >
            <IconCheck active={highlightEnabled} />
            <span className={styles.checkboxLabel}>Подсвечивать изменения</span>
          </button>
          <div className={styles.infoWrapper} ref={infoWrapperRef}>
            <button
              className={styles.infoBtn}
              onClick={() => setShowLegend(v => !v)}
              aria-label="Легенда подсветки"
            >
              <IconInfo />
            </button>
            {showLegend && <Legend onClose={() => setShowLegend(false)} />}
          </div>
        </div>
      </div>

      <div className={styles.output}>
        {!hasResult ? (
          <span className={styles.placeholder}>Результат появится здесь</span>
        ) : segments.length === 0 ? (
          <span className={styles.placeholder}>—</span>
        ) : (
          segments.map((seg, i) => <Segment key={i} segment={seg} highlight={highlightEnabled} />)
        )}
      </div>

      <div className={styles.outputFooter}>
        <button
          className={`${styles.copyBtn} ${!canCopy ? styles.copyDisabled : ''} ${copied ? styles.copied : ''}`}
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied
            ? <><IconCheckCircle color="#1ba136" />Скопировано в буфер обмена</>
            : <><IconCopy color={canCopy ? '#1ba136' : '#b8b8b8'} />Копировать</>
          }
        </button>
      </div>
    </section>
  )
}

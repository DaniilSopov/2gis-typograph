import { useState, useCallback, useEffect, useRef } from 'react'
import { useCustomScrollbar } from '../hooks/useCustomScrollbar.js'
import Legend from './Legend.jsx'
import Toggle from './Toggle.jsx'
import styles from './OutputPanel.module.css'

const TYPO_CHAR_GROUP = {
  ' ': 'nbsp',   // NBSP
  ' ': 'nbsp',   // NNBSP
  '⁠': 'zero-width', // Word Joiner
  '​': 'zero-width', // ZWSP
  '«': 'quotes', '»': 'quotes',
  '„': 'quotes', '“': 'quotes', '”': 'quotes',
  '—': 'dash-em', '–': 'dash-en',
}

const NBSP_CHARS = new Set([' ', ' '])
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
  const isNbsp = NBSP_CHARS.has(char)
  const isZw = ZW_CHARS.has(char)

  const cls = [
    styles.highlight,
    styles[`group_${group}`],
    isNbsp ? styles.nbspMark : null,
    isZw ? styles.zwMark : null,
  ].filter(Boolean).join(' ')

  let title = undefined
  if (char === ' ') title = 'Неразрывный пробел (U+00A0)'
  if (char === ' ') title = 'Узкий неразрывный пробел (U+202F)'
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
        if (char === '\n') return <span key={i}>{char}</span>
        const group = TYPO_CHAR_GROUP[char] || segment.group
        return <CharMark key={i} char={char} group={group} />
      })}
    </>
  )
}

function IconCopy() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12.25 8C14.31 8 16 9.69 16 11.75V18.25C16 20.31 14.31 22 12.25 22H5.75C3.69 22 2 20.31 2 18.25V11.75C2 9.69 3.69 8 5.75 8H12.25ZM18.25 2C20.3098 2.0001 21.9999 3.69017 22 5.75V12.25C21.9999 14.3098 20.3098 15.9999 18.25 16H17.7002V11.75C17.7001 8.75018 15.2498 6.29991 12.25 6.2998H8V5.75C8.00013 3.69017 9.69016 2.0001 11.75 2H18.25Z" fill="currentColor" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92493 23 1 18.0751 1 12C1 5.92487 5.92493 1 12 1ZM15.9502 7L10.9697 15.5996L8.90039 12H6.94043L9.24023 16C10.0102 17.3299 11.9302 17.33 12.7002 16L17.8604 7H15.9502Z" fill="currentColor" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 0C12.418 0 16 3.581 16 8C16 12.418 12.418 16 8 16C3.582 16 0 12.418 0 8C0 3.582 3.582 0 8 0ZM6 6V7.40039H8.17383L6.93945 12H8.38672L9.49219 7.88965C9.7479 6.93778 9.02984 6 8.04297 6H6ZM10 3C9.447 3 9 3.448 9 4C9 4.552 9.447 5 10 5C10.553 5 11 4.552 11 4C11 3.448 10.553 3 10 3Z" fill="currentColor" />
    </svg>
  )
}

export default function OutputPanel({ segments, processed, highlightEnabled, onToggleHighlight, active }) {
  const [copied, setCopied] = useState(false)
  const [legendMounted, setLegendMounted] = useState(false)
  const [legendVisible, setLegendVisible] = useState(false)
  const infoWrapperRef = useRef(null)
  const legendTimerRef = useRef(null)
  const outputRef = useRef(null)

  const { visible, thumbTop, thumbHeight, handleScroll } = useCustomScrollbar(outputRef)

  const openLegend = useCallback(() => {
    if (legendTimerRef.current) clearTimeout(legendTimerRef.current)
    setLegendMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setLegendVisible(true)))
  }, [])

  const closeLegend = useCallback(() => {
    setLegendVisible(false)
    legendTimerRef.current = setTimeout(() => setLegendMounted(false), 200)
  }, [])

  useEffect(() => () => clearTimeout(legendTimerRef.current), [])

  useEffect(() => {
    if (!legendMounted) return
    function handleClick(e) {
      if (infoWrapperRef.current && !infoWrapperRef.current.contains(e.target)) {
        closeLegend()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [legendMounted, closeLegend])

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
    setTimeout(() => setCopied(false), 2000)
  }, [processed])

  const hasResult = segments !== null
  const canCopy = !!processed

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.label}>Результат</span>
        <div className={styles.headerRight}>
          <Toggle
            active={highlightEnabled}
            label="Подсвечивать изменения"
            onClick={onToggleHighlight}
            ariaLabel={highlightEnabled ? 'Отключить подсветку' : 'Включить подсветку'}
          />
          <div className={styles.infoWrapper} ref={infoWrapperRef}>
            <button
              className={styles.infoBtn}
              onClick={() => legendMounted ? closeLegend() : openLegend()}
              aria-label="Легенда подсветки"
            >
              <IconInfo />
            </button>
            {legendMounted && <Legend visible={legendVisible} onClose={closeLegend} />}
          </div>
        </div>
      </div>

      <div className={styles.outputWrap}>
        <div ref={outputRef} className={`${styles.output}${active ? ` ${styles.outputActive}` : ''}`} onScroll={handleScroll}>
          {!hasResult || segments.length === 0 ? (
            <span className={styles.placeholder}>Текст автоматически появится здесь</span>
          ) : (
            segments.map((seg, i) => <Segment key={i} segment={seg} highlight={highlightEnabled} />)
          )}
        </div>

        {canCopy && (
          <button
            className={styles.copyIconBtn}
            onClick={handleCopy}
            aria-label="Копировать"
            tabIndex={-1}
          >
            <span className={styles.iconLayer} style={{ opacity: copied ? 0 : 1 }}>
              <IconCopy />
            </span>
            <span className={styles.iconLayer} style={{ opacity: copied ? 1 : 0, color: '#1BA136' }}>
              <IconCheck />
            </span>
          </button>
        )}

        {thumbHeight > 0 && (
          <div className={styles.scrollTrack} aria-hidden="true">
            <div
              className={styles.scrollThumb}
              style={{ top: thumbTop, height: thumbHeight, opacity: visible ? 1 : 0 }}
            />
          </div>
        )}
      </div>

    </section>
  )
}

import { useState, useCallback, useRef, useEffect } from 'react'
import { applyRules } from './rules.js'
import { formatOutput } from './output.js'
import { computeDiff } from './diff.js'
import { useSpellcheck } from './hooks/useSpellcheck.js'
import SpellEditor from './components/SpellEditor.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import Toggle from './components/Toggle.jsx'
import styles from './App.module.css'


function IconXmark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12.0901 1C18.1701 1 23.0901 5.92 23.0901 12C23.0901 18.08 18.1701 23 12.0901 23C6.01009 23 1.09009 18.08 1.09009 12C1.09009 5.92 6.01009 1 12.0901 1ZM12.9397 9.9502C12.4698 10.4198 11.7104 10.4198 11.2405 9.9502L8.45044 7.16016L7.25024 8.36035L10.0403 11.1504C10.5099 11.6203 10.5099 12.3797 10.0403 12.8496L7.25024 15.6396L8.45044 16.8398L11.2405 14.0498C11.7104 13.5802 12.4698 13.5802 12.9397 14.0498L15.7297 16.8398L16.9299 15.6396L14.1399 12.8496C13.6703 12.3797 13.6703 11.6203 14.1399 11.1504L16.9299 8.36035L15.7297 7.16016L12.9397 9.9502Z" fill="currentColor" />
    </svg>
  )
}

function IconUndo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 8.65471L7.65495 14.3097L8.84951 13.1151L6.2553 10.5209C5.88066 10.1462 6.14217 9.50303 6.67938 9.50304L16.5249 9.50309C18.2867 9.50309 19.7153 10.9917 19.7153 13.7854C19.7153 16.579 18.2867 18.0335 16.5249 18.0335H10.4623V19.7854L16.5249 19.7854C19.2375 19.7854 21.4361 17.547 21.4361 13.7854C21.4361 10.0237 19.2375 7.78539 16.5249 7.78539L6.72883 7.78538C6.19162 7.78537 5.91594 7.14212 6.29763 6.76043L8.85639 4.20168L7.65471 3L2 8.65471Z" fill="currentColor"/>
    </svg>
  )
}

export default function App() {
  const [input, setInput] = useState('')
  const [clearedText, setClearedText] = useState(null)
  const [result, setResult] = useState(null)
  const [highlightEnabled, setHighlightEnabled] = useState(true)
  const [spellEnabled, setSpellEnabled] = useState(true)
  const [popup, setPopup] = useState(null)
  const editorRef = useRef(null)
  const popupRef = useRef(null)

  const spellErrors = useSpellcheck(input, spellEnabled)

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setResult({ processed: input, segments: [] })
      return
    }
    const processed = formatOutput(applyRules(input), 'unicode')
    const segments = computeDiff(input, processed)
    setResult({ processed, segments })
  }, [input])

  useEffect(() => {
    if (!input.trim()) { handleProcess(); return }
    const timer = setTimeout(handleProcess, 300)
    return () => clearTimeout(timer)
  }, [handleProcess, input])

  useEffect(() => {
    if (input && clearedText !== null) setClearedText(null)
  }, [input, clearedText])

  const handleEditorClick = useCallback((e) => {
    if (!spellErrors.length) return
    const el = editorRef.current
    if (!el) return
    const sel = window.getSelection()
    if (!sel?.rangeCount) { setPopup(null); return }
    const r = sel.getRangeAt(0)
    const pre = r.cloneRange()
    pre.selectNodeContents(el)
    pre.setEnd(r.startContainer, r.startOffset)
    const pos = pre.toString().length
    const err = spellErrors.find(er => pos >= er.pos && pos <= er.pos + er.len)
    if (!err || !err.s?.length) { setPopup(null); return }
    setPopup({ x: e.clientX, y: e.clientY + 18, suggestions: err.s, pos: err.pos, len: err.len })
  }, [spellErrors])

  const applySuggestion = useCallback((suggestion) => {
    if (!popup) return
    const newInput = input.slice(0, popup.pos) + suggestion + input.slice(popup.pos + popup.len)
    setInput(newInput)
    setPopup(null)
  }, [input, popup])

  useEffect(() => {
    if (!popup) return
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setPopup(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [popup])

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <img src="/2gis-logo.svg" alt="2GIS" className={styles.logo} />
        <div className={styles.headerText}>
          <div className={styles.headerTitle}>
            2GIS <span className={styles.headerTitleGray}>Типограф</span>
          </div>
          <div className={styles.headerSubtitle}>Расставляет типографические символы</div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.inputSection}>
          <div className={styles.sectionHeader}>
            <span>Исходный текст</span>
            <Toggle
              active={spellEnabled}
              label="Орфография"
              onClick={() => setSpellEnabled(v => !v)}
              ariaLabel={spellEnabled ? 'Отключить проверку орфографии' : 'Включить проверку орфографии'}
            />
          </div>
          <div className={styles.textareaWrapper}>
            <SpellEditor
              ref={editorRef}
              value={input}
              onChange={setInput}
              errors={spellEnabled ? spellErrors : []}
              onClick={handleEditorClick}
              onScroll={() => setPopup(null)}
              placeholder="Вставьте текст сюда..."
              isEmpty={!input}
            />
            {input ? (
              <button
                className={styles.clearBtn}
                onClick={() => { setClearedText(input); setInput('') }}
                aria-label="Очистить"
                tabIndex={-1}
              >
                <IconXmark />
              </button>
            ) : clearedText !== null ? (
              <button
                className={styles.clearBtn}
                onClick={() => { setInput(clearedText); setClearedText(null) }}
                aria-label="Вернуть"
                tabIndex={-1}
              >
                <IconUndo />
              </button>
            ) : null}
          </div>
        </section>

        <OutputPanel
          segments={result?.segments ?? null}
          processed={result?.processed ?? null}
          highlightEnabled={highlightEnabled}
          onToggleHighlight={() => setHighlightEnabled(v => !v)}
          active={!!input}
        />
      </main>

      {popup && (
        <div
          ref={popupRef}
          className={styles.suggestionPopup}
          style={{ left: popup.x, top: popup.y }}
        >
          {popup.suggestions.map((s, i) => (
            <button key={i} className={styles.suggestionItem} onClick={() => applySuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <footer className={styles.footer}>
        © 2026, Даниил Сопов
      </footer>
    </div>
  )
}

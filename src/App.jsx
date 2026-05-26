import { useState, useCallback, useRef, useEffect } from 'react'
import { applyRules } from './rules.js'
import { formatOutput } from './output.js'
import { computeDiff } from './diff.js'
import { useSpellcheck } from './hooks/useSpellcheck.js'
import SpellEditor from './components/SpellEditor.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import Toggle from './components/Toggle.jsx'
import styles from './App.module.css'

function IconTextFormat() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.53815 5L13.6358 19H11.8253L10.6241 15.7012H4.0108L2.80963 19H1.00006L6.09772 5H8.53815ZM19.2481 8C21.3099 8 23.0001 9.689 23.0001 11.75V19H21.2989V17.9043C20.7477 18.5671 19.9273 18.999 18.9981 18.999H17.7208C16.0622 18.9989 14.7198 17.656 14.7198 15.999V15.2979C14.7199 13.642 16.0622 12.2979 17.7208 12.2979H21.2989V10.7002C21.2989 10.1502 20.8491 9.7002 20.2989 9.7002H15.6964V8H19.2481ZM16.3194 13.998V17.2988H21.3008V13.998H16.3194ZM4.63092 14.001H10.0079L7.31842 6.61914L4.63092 14.001Z" fill="currentColor" />
    </svg>
  )
}


function IconXmark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12.0901 1C18.1701 1 23.0901 5.92 23.0901 12C23.0901 18.08 18.1701 23 12.0901 23C6.01009 23 1.09009 18.08 1.09009 12C1.09009 5.92 6.01009 1 12.0901 1ZM12.9397 9.9502C12.4698 10.4198 11.7104 10.4198 11.2405 9.9502L8.45044 7.16016L7.25024 8.36035L10.0403 11.1504C10.5099 11.6203 10.5099 12.3797 10.0403 12.8496L7.25024 15.6396L8.45044 16.8398L11.2405 14.0498C11.7104 13.5802 12.4698 13.5802 12.9397 14.0498L15.7297 16.8398L16.9299 15.6396L14.1399 12.8496C13.6703 12.3797 13.6703 11.6203 14.1399 11.1504L16.9299 8.36035L15.7297 7.16016L12.9397 9.9502Z" fill="currentColor" />
    </svg>
  )
}

export default function App() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [highlightEnabled, setHighlightEnabled] = useState(true)
  const [spellEnabled, setSpellEnabled] = useState(true)
  const [popup, setPopup] = useState(null)
  const editorRef = useRef(null)
  const popupRef = useRef(null)

  const spellErrors = useSpellcheck(input, spellEnabled)

  const handleProcess = useCallback(() => {
    const raw = input
    if (!raw.trim()) {
      setResult({ processed: raw, segments: [] })
      return
    }
    const processed = formatOutput(applyRules(raw), 'unicode')
    const segments = computeDiff(raw, processed)
    setResult({ processed, segments })
  }, [input])

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleProcess()
    }
  }, [handleProcess])

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
              onKeyDown={handleKeyDown}
              onClick={handleEditorClick}
              onScroll={() => setPopup(null)}
              placeholder="Вставьте текст сюда..."
            />
            {input && (
              <button
                className={styles.clearBtn}
                onClick={() => setInput('')}
                aria-label="Очистить"
                tabIndex={-1}
              >
                <IconXmark />
              </button>
            )}
          </div>
          <div className={styles.inputFooter}>
            <span className={styles.hint}>Ctrl + Enter — типографировать</span>
            <button
              className={styles.processBtn}
              onClick={handleProcess}
              disabled={!input}
            >
              <IconTextFormat />
              Типографировать
            </button>
          </div>
        </section>

        <OutputPanel
          segments={result?.segments ?? null}
          processed={result?.processed ?? null}
          highlightEnabled={highlightEnabled}
          onToggleHighlight={() => setHighlightEnabled(v => !v)}
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

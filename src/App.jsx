import { useState, useCallback } from 'react'
import { applyRules } from './rules.js'
import { formatOutput } from './output.js'
import { computeDiff } from './diff.js'
import OutputPanel from './components/OutputPanel.jsx'
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
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="11" fill="rgba(20,20,20,0.12)" />
      <path d="M7.5 7.5l7 7M14.5 7.5l-7 7" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function App() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [highlightEnabled, setHighlightEnabled] = useState(true)

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

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <img src="/2gis-logo.svg" alt="2GIS" className={styles.logo} />
        <div className={styles.headerText}>
          <div className={styles.headerTitle}>
            2GIS <span className={styles.headerTitleGray}>Типограф</span>
          </div>
          <div className={styles.headerSubtitle}>Расставляет правильные типографические символы</div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.inputSection}>
          <div className={styles.sectionHeader}>Исходный текст</div>
          <div className={styles.textareaWrapper}>
            <textarea
              id="input"
              className={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Вставьте текст сюда..."
              spellCheck={false}
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

      <footer className={styles.footer}>
        © 2026, Даниил Сопов
      </footer>
    </div>
  )
}

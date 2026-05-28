import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useCustomScrollbar } from '../hooks/useCustomScrollbar.js'
import styles from './SpellEditor.module.css'

function getEditorText(el) {
  const text = el.innerText ?? ''
  return text.endsWith('\n') ? text.slice(0, -1) : text
}

function caretOffset(root) {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return 0
  const r = sel.getRangeAt(0)
  const pre = r.cloneRange()
  pre.selectNodeContents(root)
  pre.setEnd(r.startContainer, r.startOffset)
  return pre.toString().length
}

function moveCaretTo(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node, rem = offset
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length
    if (rem <= len) {
      const r = document.createRange()
      r.setStart(node, rem)
      r.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(r)
      return
    }
    rem -= len
  }
  const r = document.createRange()
  r.selectNodeContents(root)
  r.collapse(false)
  window.getSelection().removeAllRanges()
  window.getSelection().addRange(r)
}

function renderContent(el, text, errors) {
  while (el.firstChild) el.removeChild(el.firstChild)
  if (!text) return
  const sorted = [...errors].sort((a, b) => a.pos - b.pos)
  let cur = 0
  for (const err of sorted) {
    if (err.pos > cur) el.appendChild(document.createTextNode(text.slice(cur, err.pos)))
    const sp = document.createElement('span')
    sp.className = styles.error
    sp.textContent = text.slice(err.pos, err.pos + err.len)
    el.appendChild(sp)
    cur = err.pos + err.len
  }
  if (cur < text.length) el.appendChild(document.createTextNode(text.slice(cur)))
}

const SpellEditor = forwardRef(function SpellEditor(
  { value, onChange, errors = [], onKeyDown, onClick, onScroll, placeholder, isEmpty },
  ref
) {
  const elRef = useRef(null)
  useImperativeHandle(ref, () => elRef.current)

  const { visible, thumbTop, thumbHeight, handleScroll: scrollbarHandle } = useCustomScrollbar(elRef)

  const fromInput = useRef(false)
  const prevValue = useRef(value)
  const errorsRef = useRef(errors)
  useEffect(() => { errorsRef.current = errors }, [errors])

  // Initial render
  useEffect(() => {
    if (elRef.current) renderContent(elRef.current, value, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Errors updated (debounced): rebuild preserving caret
  useEffect(() => {
    const el = elRef.current
    if (!el || getEditorText(el) !== value) return
    const focused = document.activeElement === el
    const pos = focused ? caretOffset(el) : -1
    renderContent(el, value, errors)
    if (focused && pos >= 0) moveCaretTo(el, pos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors])

  // External value change (suggestion applied, clear button)
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    if (fromInput.current) { fromInput.current = false; return }
    if (prevValue.current === value) return
    prevValue.current = value
    renderContent(el, value, errorsRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleInput = useCallback(() => {
    const el = elRef.current
    if (!el) return
    fromInput.current = true
    // Clean up stray nodes when editor is visually empty
    if (!el.textContent && el.childNodes.length) el.innerHTML = ''
    const text = getEditorText(el)
    prevValue.current = text
    onChange(text)
  }, [onChange])

  const handleKeyDown2 = useCallback((e) => {
    // Plain Enter → newline; Ctrl/Cmd+Enter passes through to App handler
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      document.execCommand('insertText', false, '\n') // eslint-disable-line no-restricted-globals
    }
    onKeyDown?.(e)
  }, [onKeyDown])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text) // eslint-disable-line no-restricted-globals
  }, [])

  const handleScroll = useCallback((e) => {
    scrollbarHandle(e)
    onScroll?.(e)
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    el.style.caretColor = (el.scrollTop < 0 || el.scrollTop > maxScroll) ? 'transparent' : ''
  }, [scrollbarHandle, onScroll])

  return (
    <div className={styles.wrap}>
      <div
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        className={`${styles.editor}${isEmpty ? ` ${styles.editorEmpty}` : ''}`}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown2}
        onPaste={handlePaste}
        onScroll={handleScroll}
        onClick={onClick}
        role="textbox"
        aria-multiline="true"
        spellCheck={false}
      />
      {thumbHeight > 0 && (
        <div className={styles.scrollTrack} aria-hidden="true">
          <div
            className={styles.scrollThumb}
            style={{ top: thumbTop, height: thumbHeight, opacity: visible ? 1 : 0 }}
          />
        </div>
      )}
    </div>
  )
})

export default SpellEditor

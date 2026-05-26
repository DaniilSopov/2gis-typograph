import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import styles from './SpellEditor.module.css'

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
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(r)
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
  { value, onChange, errors = [], onKeyDown, onClick, onScroll, placeholder },
  ref
) {
  const elRef = useRef(null)
  useImperativeHandle(ref, () => elRef.current)

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
    if (!el || el.textContent !== value) return
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
    // Clean up stray <br> browsers insert when last char is deleted
    if (!el.textContent && el.childNodes.length) el.innerHTML = ''
    const text = el.textContent
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

  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      className={styles.editor}
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown2}
      onPaste={handlePaste}
      onScroll={onScroll}
      onClick={onClick}
      role="textbox"
      aria-multiline="true"
      spellCheck={false}
    />
  )
})

export default SpellEditor

import { useState, useCallback, useRef, useEffect } from 'react'

export function useCustomScrollbar(elRef) {
  const [visible, setVisible] = useState(false)
  const [thumbTop, setThumbTop] = useState(8)
  const [thumbHeight, setThumbHeight] = useState(0)
  const timerRef = useRef(null)

  const recalc = useCallback((el) => {
    if (!el) return
    const { scrollHeight, clientHeight, scrollTop } = el
    if (scrollHeight <= clientHeight) {
      setThumbHeight(0)
      return
    }
    const margin = 8
    const trackH = clientHeight - margin * 2
    const h = Math.max(28, (clientHeight / scrollHeight) * trackH)
    const rawTop = margin + (scrollTop / (scrollHeight - clientHeight)) * (trackH - h)
    const top = Math.max(margin, Math.min(clientHeight - margin - h, rawTop))
    setThumbHeight(h)
    setThumbTop(top)
  }, [])

  const handleScroll = useCallback((e) => {
    recalc(e.currentTarget)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 1000)
  }, [recalc])

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    recalc(el)
    const observer = new MutationObserver(() => recalc(elRef.current))
    observer.observe(el, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      clearTimeout(timerRef.current)
    }
  }, [recalc, elRef])

  return { visible, thumbTop, thumbHeight, handleScroll }
}

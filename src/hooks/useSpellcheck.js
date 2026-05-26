import { useState, useEffect } from 'react'

const API = 'https://speller.yandex.net/services/spellservice.json/checkText'

export function useSpellcheck(text, enabled) {
  const [errors, setErrors] = useState([])

  useEffect(() => {
    if (!enabled || !text?.trim()) {
      setErrors([])
      return
    }
    const controller = new AbortController()
    const delay = /[\s.,!?;:]$/.test(text) ? 100 : 500
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}?lang=ru&options=4&text=${encodeURIComponent(text)}`,
          { signal: controller.signal }
        )
        if (res.ok) setErrors(await res.json())
      } catch (e) {
        if (e.name !== 'AbortError') setErrors([])
      }
    }, delay)
    return () => { clearTimeout(id); controller.abort() }
  }, [text, enabled])

  return errors
}

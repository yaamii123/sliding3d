import { useEffect, useState } from 'react'

export function useCompactHud(): boolean {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 860px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 860px)')
    const onChange = () => setCompact(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return compact
}

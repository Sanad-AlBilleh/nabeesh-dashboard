import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounce = 300,
  width = 240,
}) {
  const [local, setLocal] = useState(value || '')
  const timer = useRef(null)

  useEffect(() => {
    setLocal(value || '')
  }, [value])

  function handleChange(e) {
    const val = e.target.value
    setLocal(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(val), debounce)
  }

  function clear() {
    setLocal('')
    onChange('')
  }

  return (
    <div style={{ position: 'relative', width }}>
      <Search
        size={14}
        color="var(--text-muted)"
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ paddingLeft: 32, paddingRight: local ? 32 : 12 }}
      />
      {local && (
        <button
          onClick={clear}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            color: 'var(--text-muted)',
            padding: 2,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function TagInput({ value = [], onChange, placeholder = 'Add tag...', max }) {
  const [input, setInput] = useState('')

  function addTag(tag) {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) return
    if (max && value.length >= max) return
    onChange([...value, trimmed])
    setInput('')
  }

  function removeTag(tag) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '6px 10px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        minHeight: 40,
        cursor: 'text',
        alignItems: 'center',
      }}
      onClick={() => document.querySelector('.tag-input-field')?.focus()}
    >
      {value.map(tag => (
        <span
          key={tag}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(129,140,248,0.12)',
            color: 'var(--accent)',
            border: '1px solid rgba(129,140,248,0.25)',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            style={{ background: 'transparent', color: 'var(--accent)', display: 'flex', padding: 1 }}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        className="tag-input-field"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(input)}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: 80,
          background: 'transparent',
          border: 'none',
          padding: '2px 4px',
          fontSize: 13,
          color: 'var(--text-primary)',
          outline: 'none',
          boxShadow: 'none',
          width: 'auto',
        }}
      />
    </div>
  )
}

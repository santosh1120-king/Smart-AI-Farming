import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ThemedSelect({ 
  value, 
  onChange, 
  options, 
  label, 
  id, 
  placeholder = 'Select option...' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt === value || (typeof opt === 'object' && opt.value === value))
  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) 
    : placeholder

  return (
    <div className="themed-select-container" ref={containerRef}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <div className="themed-select" id={id}>
        <button
          type="button"
          className={`themed-select-trigger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="themed-select-value">{displayValue || 'All'}</span>
          <ChevronDown size={18} className={`themed-select-icon ${isOpen ? 'rotate' : ''}`} />
        </button>

        {isOpen && (
          <ul className="themed-select-menu animate-in" role="listbox">
            {options.map((option, index) => {
              const optValue = typeof option === 'object' ? option.value : option
              const optLabel = typeof option === 'object' ? option.label : option
              const isSelected = optValue === (value || '') || (optValue === '' && !value)

              return (
                <li
                  key={index}
                  className={`themed-select-option ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange({ target: { value: optValue, name: id } })
                    setIsOpen(false)
                  }}
                >
                  {optLabel}
                  {isSelected && <div className="selected-dot" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

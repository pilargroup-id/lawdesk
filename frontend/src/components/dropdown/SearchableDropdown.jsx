import React from 'react'

export default function SearchableDropdown({
  id,
  label,
  placeholder,
  value,
  search,
  setSearch,
  setValue,
  options,
  isOpen,
  setIsOpen,
}) {
  return (
    <div className="register-user-popup__field" style={{ position: 'relative' }}>
      <label className="register-user-popup__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="register-user-popup__input"
        placeholder={placeholder}
        value={search}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onChange={(e) => {
          setSearch(e.target.value)
          setValue('')
          setIsOpen(true)
        }}
      />
      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: '180px',
            overflowY: 'auto',
            margin: '2px 0 0',
            padding: 0,
            listStyle: 'none',
          }}
        >
          {options
            .filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
            .map((opt) => (
              <li
                key={opt.id}
                onMouseDown={() => {
                  setValue(opt.id)
                  setSearch(opt.name)
                  setIsOpen(false)
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: '#111827',
                  background: opt.id === value ? '#f3f4f6' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = opt.id === value ? '#f3f4f6' : 'transparent')
                }
              >
                {opt.name}
              </li>
            ))}
          {options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
            .length === 0 && (
            <li
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.85rem',
                color: '#9ca3af',
              }}
            >
              Tidak ada hasil
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

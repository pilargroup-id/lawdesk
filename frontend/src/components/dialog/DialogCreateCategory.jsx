import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { XClose } from '../template/TemplateIcons.jsx'

function DialogCreateCategory({
  isOpen = false,
  eyebrow = 'Create Data',
  title = 'Create Category',
  confirmLabel = 'Create',
  initialName = '',
  onClose,
  onConfirm,
}) {
  const [categoryName, setCategoryName] = useState(initialName)

  useEffect(() => {
    if (!isOpen) {
      setCategoryName('')
      return undefined
    } else {
      setCategoryName(initialName)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  if (typeof document === 'undefined') {
    return null
  }

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup register-user-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-create-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id="dialog-create-title">
              {title}
            </h2>
          </div>

          <button
            type="button"
            className="dashboard-popup__close"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body">
          <div className="register-user-popup__layout">
            <div className="register-user-popup__main" style={{ width: '100%' }}>
              <div className="register-user-popup__form">
                <div className="register-user-popup__grid">
                  <div className="register-user-popup__field register-user-popup__field--full">
                    <label className="register-user-popup__label" htmlFor="category-name">
                      Category Name
                    </label>
                    <input
                      id="category-name"
                      type="text"
                      className="register-user-popup__input"
                      placeholder="Masukkan nama category"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--primary"
            onClick={() => onConfirm?.({ name: categoryName })}
            disabled={!categoryName.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogCreateCategory

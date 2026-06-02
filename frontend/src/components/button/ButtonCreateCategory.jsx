const buttonClassNames = {
  detail: 'users-table__detail-button',
  accordion: 'users-table__accordion-button',
  icon: 'users-table__icon-button',
  pagination: 'users-table-pagination__button',
  primary: 'dashboard-popup__button dashboard-popup__button--primary',
}

function CreateButtonCategory({
  children,
  className = '',
  variant = 'primary',
  tone = 'default',
  active = false,
  hasIndicator = false,
  type = 'button',
  ...buttonProps
}) {
  const buttonClassName = [
    buttonClassNames[variant] ?? buttonClassNames.primary,
    variant === 'accordion' && tone === 'danger' ? 'users-table__accordion-button--danger' : '',
    variant === 'accordion' && tone === 'warning' ? 'users-table__accordion-button--warning' : '',
    variant === 'detail' && hasIndicator ? 'users-table__detail-button--indicator' : '',
    variant === 'accordion' && hasIndicator ? 'users-table__accordion-button--indicator' : '',
    variant === 'icon' && tone === 'danger' ? 'users-table__icon-button--danger' : '',
    variant === 'pagination' && active ? 'users-table-pagination__button--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={buttonClassName} {...buttonProps}>
      {children}
    </button>
  )
}

export default CreateButtonCategory

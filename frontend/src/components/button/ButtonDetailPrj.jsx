import { ChevronRight } from '../template/TemplateIcons.jsx'

const buttonClassNames = {
  action: 'users-table-card__action',
  detail: 'users-table__detail-button',
  accordion: 'users-table__accordion-button',
  icon: 'users-table__icon-button',
  pagination: 'users-table-pagination__button',
}

function ButtonDetailPrj({
  children,
  className = '',
  variant = 'detail',
  tone = 'default',
  active = false,
  type = 'button',
  ...buttonProps
}) {
  const buttonClassName = [
    buttonClassNames[variant] ?? buttonClassNames.detail,
    variant === 'accordion' && tone === 'danger' ? 'users-table__accordion-button--danger' : '',
    variant === 'accordion' && tone === 'warning' ? 'users-table__accordion-button--warning' : '',
    variant === 'accordion' && tone === 'info' ? 'users-table__accordion-button--info' : '',
    variant === 'icon' && tone === 'danger' ? 'users-table__icon-button--danger' : '',
    variant === 'pagination' && active ? 'users-table-pagination__button--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={buttonClassName} {...buttonProps}>
      <span>{children || 'Detail'}</span>
      <ChevronRight size={14} />
    </button>
  )
}

export default ButtonDetailPrj

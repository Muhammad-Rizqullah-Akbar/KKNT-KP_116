import { clsx } from 'clsx'
import { Icon, type IconName } from '@/components/ui/Icons'

interface ButtonProps {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  iconPosition?: 'left' | 'right'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 hover:shadow-cyan-500/40',
    secondary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25',
    outline: 'bg-white/[0.03] border border-white/[0.06] text-white/70 hover:text-white hover:border-white/10',
    ghost: 'bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && iconPosition === 'left' && <Icon name={icon} className="w-4 h-4" />}
      {children}
      {icon && iconPosition === 'right' && <Icon name={icon} className="w-4 h-4" />}
    </button>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/ui/Icons'
import { clsx } from 'clsx'

interface SidebarItemProps {
  href: string
  icon: IconName
  label: string
  badge?: string | number
  isActive?: boolean
  onClick?: () => void
}

export function SidebarItem({
  href,
  icon,
  label,
  badge,
  isActive: propIsActive,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = propIsActive ?? pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group',
        isActive
          ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20'
          : 'text-white/45 hover:bg-white/[0.03] hover:text-white'
      )}
    >
      <Icon name={icon} className={clsx('w-4 h-4 flex-shrink-0')} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className={clsx(
            'text-xs px-2 py-0.5 rounded-full',
            isActive
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-white/[0.05] text-white/40'
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
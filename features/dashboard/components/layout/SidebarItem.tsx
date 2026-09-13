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
  isCollapsed?: boolean
  onClick?: () => void
}

export function SidebarItem({
  href,
  icon,
  label,
  badge,
  isActive: propIsActive,
  isCollapsed = false,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname()
  const isActive =
    propIsActive ??
    (pathname === href ||
      (href !== '/dashboard/overview' &&
        href !== '/dashboard' &&
        href !== '/dashboard/forms' &&
        pathname.startsWith(href)))

  if (isCollapsed) {
    return (
      <Link
        href={href}
        onClick={onClick}
        title={`${label}${badge ? ` (${badge})` : ''}`}
        className={clsx(
          'flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-sm transition-all group relative',
          isActive
            ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 shadow-md shadow-cyan-500/10'
            : 'text-white/45 hover:bg-white/[0.05] hover:text-white'
        )}
      >
        <Icon name={icon} className="w-5 h-5 flex-shrink-0" />
      </Link>
    )
  }

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
      <Icon name={icon} className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={clsx(
            'text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors shrink-0',
            badge === 'V1.5' || badge === 'Baru'
              ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
              : badge === 'V1.0' || badge === 'Lama'
              ? 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
              : badge === 'CMS'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : badge === 'Admin'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : isActive
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
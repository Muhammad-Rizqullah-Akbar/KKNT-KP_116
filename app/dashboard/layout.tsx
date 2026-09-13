import { DashboardAuthGuard } from '@/features/dashboard/components/DashboardAuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardAuthGuard>{children}</DashboardAuthGuard>
}
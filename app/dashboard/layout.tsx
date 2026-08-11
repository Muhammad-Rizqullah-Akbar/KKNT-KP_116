import { DashboardAuthGuard } from '@/components/dashboard/DashboardAuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardAuthGuard>{children}</DashboardAuthGuard>
}
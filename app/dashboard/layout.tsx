import { Sidebar } from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#06060E]">
      <Sidebar />
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  )
}
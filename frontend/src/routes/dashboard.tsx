import { Dashboard } from '@/features/dashboard/components/Dashboard'
import { AppLayout } from '@/shared/components/AppLayout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <Dashboard/>
    </AppLayout>
  )
}

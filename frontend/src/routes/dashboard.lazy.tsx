import { Dashboard } from '@/features/dashboard/components/Dashboard'
import { AppLayout } from '@/shared/components/AppLayout'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  )
}
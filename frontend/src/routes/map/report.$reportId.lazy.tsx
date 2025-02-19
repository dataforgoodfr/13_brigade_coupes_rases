import { AsideForm } from '@/features/clear-cutting/components/Form'
import { createLazyFileRoute, useParams } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/map/report/$reportId')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ strict: false })

  return <AsideForm clearCuttingId={params.reportId} />
}

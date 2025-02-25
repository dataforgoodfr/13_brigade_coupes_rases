import { InteractiveMap } from '@/features/clear-cutting/components/map/InteractiveMap'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/map')({
  component: RouteComponent,
})

function RouteComponent() {
  return <InteractiveMap />;
}

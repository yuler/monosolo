import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign/verify')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/sign/verify"!</div>
}

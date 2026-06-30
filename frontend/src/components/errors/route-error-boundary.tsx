import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"

export function RouteErrorBoundary() {
  const error = useRouteError()

  let title = "Unexpected routing error"
  let description = "The page failed to load."

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    description =
      typeof error.data === "string" ? error.data : "Route data failed to load."
  } else if (error instanceof Error) {
    description = error.message
  }

  return (
    <div className="bg-background text-foreground grid min-h-svh place-items-center p-6">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
        <Link to="/" className={buttonVariants()}>
          Go home
        </Link>
      </div>
    </div>
  )
}

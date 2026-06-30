import React from "react"

import { Button } from "@/components/ui/button"

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
    }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Global UI error", { error, errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="bg-background text-foreground grid min-h-svh place-items-center p-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected UI error happened. Reload and try again.
          </p>
          <Button onClick={this.handleReload}>Reload app</Button>
        </div>
      </div>
    )
  }
}

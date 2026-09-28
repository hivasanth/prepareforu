import { Component, type ReactNode } from 'react'
import { reportError } from '../../../utils/logger'
import { VisualFallback } from './VisualFallback'
import type { VisualErrorCode } from './visualErrorCodes'

interface Props {
  children?: ReactNode
  visualType: string
  title?: string | null
  code?: VisualErrorCode
}

interface State {
  hasError: boolean
}

class VisualErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    reportError(error, {
      component: 'VisualErrorBoundary',
      visualType: this.props.visualType,
      visualTitle: this.props.title,
      visualErrorCode: this.props.code ?? 'VISUAL_RENDER_ERROR',
    })
  }

  reset() {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <VisualFallback
          code={this.props.code ?? 'VISUAL_RENDER_ERROR'}
          label={this.props.title ?? undefined}
        />
      )
    }
    return this.props.children
  }
}

export default VisualErrorBoundary

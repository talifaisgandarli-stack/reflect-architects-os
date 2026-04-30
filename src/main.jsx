import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary:', error, info)
    }
  }
  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          fontFamily: 'system-ui, sans-serif', textAlign: 'center', gap: 16
        }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Bir xəta baş verdi</h1>
          <p style={{ color: '#555', margin: 0 }}>Səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin.</p>
          <button onClick={this.handleReload} style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: '#111', color: '#fff', cursor: 'pointer'
          }}>Səhifəni yenilə</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

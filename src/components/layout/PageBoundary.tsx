import { Component, Suspense, type ReactNode } from 'react';

export class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section className="sk-page-loading" role="alert"><h1>This page could not load.</h1><p>Check your connection and try again. Your saved shortlist stays on this device.</p><button type="button" onClick={() => window.location.reload()}>Reload page</button></section>;
    return <Suspense fallback={<div className="sk-page-loading" role="status"><span className="sk-page-loading__shape" aria-hidden="true"/><p>Finding your space…</p></div>}>{this.props.children}</Suspense>;
  }
}

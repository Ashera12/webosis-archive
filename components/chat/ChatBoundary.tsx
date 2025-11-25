"use client";
import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ChatBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Log tanpa mengganggu UI keseluruhan
    console.error('[LiveChatWidget] crashed:', error, info);
  }

  render() {
    if (this.state.hasError) return null; // fail-silent agar tidak bikin white screen
    return this.props.children;
  }
}

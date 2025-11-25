"use client";
import React from 'react';
import LiveChatWidget from './chat/LiveChatWidget';
import OpenLiveChatButton from './chat/OpenLiveChatButton';

export default function ClientRole({ role }: { role?: 'super_admin' | 'member' | 'guest' }) {
  return (
    <>
      {/* Live Chat AI floating widget */}
      {/* Top-right button as requested */}
      <OpenLiveChatButton />
      <LiveChatWidget role={role} />
    </>
  );
}

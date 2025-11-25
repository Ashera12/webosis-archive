"use client";
import React from 'react';
import { FaComments } from 'react-icons/fa';

export default function OpenLiveChatButton() {
  const open = () => {
    window.dispatchEvent(new CustomEvent('open-live-chat'));
  };
  return (
    <button
      onClick={open}
      // Hide top-right button on small screens to avoid overlapping the
      // floating bottom chat button; show on sm+ screens.
      className="hidden sm:flex fixed top-6 right-6 px-3 py-2 rounded-full bg-yellow-400 hover:bg-amber-500 text-slate-900 shadow-lg text-sm font-semibold"
      aria-label="Open AI Chat"
      suppressHydrationWarning
    >
      <span className="inline-flex items-center gap-2"><FaComments /> AI Chat</span>
    </button>
  );
}

"use client";

import React from 'react';
import Hero from '../design-system/components/Hero';

export default function ClientAdminPage() {
  return (
    <div>
      <Hero title="Admin — System Excellence" subtitle="Warm neutrals and predictable spacing (Variant B)." variation="b" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard (applied Variant B)</h1>
        <p className="text-gray-600">This admin preview uses the design-system tokens for Variant B. We'll proceed incrementally for other admin pages.</p>
      </div>
    </div>
  );
}


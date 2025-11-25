import React from 'react';

export default function PreviewIndex() {
  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, Arial' }}>
      <h1 style={{ marginBottom: 8 }}>Design System — Preview</h1>
      <p style={{ color: '#374151', marginBottom: 18 }}>Preview the three variants (A / B / C). These previews are read-only and do not change the admin UI.</p>
      <ul>
        <li><a href="/design-system/preview/a">Variant A — Minimalism (Editorial)</a></li>
        <li><a href="/design-system/preview/b">Variant B — System Excellence</a></li>
        <li><a href="/design-system/preview/c">Variant C — Interaction</a></li>
      </ul>
      <hr style={{ marginTop: 20, marginBottom: 20 }} />
      <p style={{ fontSize: 13, color: '#6b7280' }}>When you choose a variant, tell me and I will (1) make a backup of `app/admin`, then (2) apply the variant incrementally with safe commits.</p>
    </div>
  );
}

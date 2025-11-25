import React from 'react';
import VariationA from '../../variants/VariationA';

export default function PreviewA() {
  return (
    <div>
      <div style={{ padding: 18 }}>
        <a href="/design-system/preview">← Back to preview list</a>
      </div>
      <VariationA />
    </div>
  );
}

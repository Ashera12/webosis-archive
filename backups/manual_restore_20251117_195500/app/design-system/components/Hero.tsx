"use client";
import React from 'react';
import Button from './Button';
import '../styles.css';

type Props = {
  title: string;
  subtitle?: string;
  variation?: 'a' | 'b' | 'c';
};

export default function Hero({ title, subtitle, variation = 'a' }: Props) {
  const cls = `ds-root ds-variation-${variation}`;
  return (
    <section className={cls}>
      <div className="ds-container">
        <div className="ds-hero">
          <div className="media" aria-hidden />
          <div className="content">
            <h1 className="ds-heading">{title}</h1>
            {subtitle && <p className="ds-subtle">{subtitle}</p>}
            <div style={{ marginTop: 20 }}>
              <Button>Explore</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

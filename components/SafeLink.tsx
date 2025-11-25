'use client';

import React from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/hooks/useTranslation';

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: (e?: React.SyntheticEvent) => void;
  showToastOnEmpty?: boolean;
}

/**
 * SafeLink component that prevents navigation to empty or invalid links
 * and shows a toast notification instead
 */
export default function SafeLink({
  href,
  children,
  className = '',
  target,
  rel,
  onClick,
  showToastOnEmpty = true
}: SafeLinkProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleClick = (e?: React.SyntheticEvent) => {
    // If an event was provided, try to prevent default navigation
    if (e && typeof (e as React.SyntheticEvent).preventDefault === 'function') {
      e.preventDefault();
    }

    // Check if href is empty, "#", or other invalid values
    if (!href || href === '#' || href === '' || href === 'javascript:void(0)' || href === 'about:blank') {
      if (showToastOnEmpty) {
        showToast(t('toast.linkNotActive'), 'warning');
      }
      return;
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  // If href is valid and starts with http or mailto, use regular anchor tag
  if (href && (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))) {
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  // For empty or invalid hrefs, render as button-like element
  if (!href || href === '#' || href === '' || href === 'javascript:void(0)') {
    return (
      <span
        className={`${className} cursor-pointer`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            // call handler without casting; it accepts a SyntheticEvent
            handleClick();
          }
        }}
      >
        {children}
      </span>
    );
  }

  // For internal links, use Next.js Link
  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}

"use client";
import React from 'react';

// Lightweight inline SVG brand icons to reduce bundle size vs react-icons
// All sized via currentColor so parent can control color

type IconProps = { className?: string; size?: number };

const makeIcon = (path: React.ReactNode, viewBox = '0 0 24 24') => ({ className, size = 20 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

export const InstagramIcon = makeIcon(
  <>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="7" r="1.5" />
  </>
);

export const YoutubeIcon = makeIcon(
  <>
    <path d="M21.8 8.001a3 3 0 0 0-2.11-2.123C18.23 5.5 12 5.5 12 5.5s-6.23 0-7.69.378A3 3 0 0 0 2.2 8.001C1.875 9.54 1.875 12 1.875 12s0 2.46.325 3.999a3 3 0 0 0 2.11 2.123C5.77 18.5 12 18.5 12 18.5s6.23 0 7.69-.378a3 3 0 0 0 2.11-2.123C22.125 14.46 22.125 12 22.125 12s0-2.46-.325-3.999Z" />
    <path d="M10 15.5v-7l6 3.5-6 3.5Z" fill="#fff" />
  </>
);

export const SpotifyIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 9.5c3-.5 5.5.2 7.5 1.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M8.5 12c2.3-.4 4.4.2 6 .9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <path d="M9 14.2c1.7-.3 3.2.2 4.3.7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
  </>
);

export const TiktokIcon = makeIcon(
  <>
    <path d="M15 3v3.2c0 1.3 1.3 2.6 3 2.6v2.2c-1.8 0-3.4-.8-4.5-2v6.6a4.5 4.5 0 1 1-4.5-4.5h.2v2.3a2.3 2.3 0 1 0 2.3 2.3V3h3.5Z" />
  </>
);

// Generic heart (variant) for possible reuse separate from FaHeart
export const HeartIcon = makeIcon(
  <path d="M12 21s-1.6-1.4-3.2-2.9C5.4 15.9 3 13.7 3 10.7 3 8.2 5 6.5 7.4 6.5c1.4 0 2.7.7 3.6 1.8.9-1.1 2.2-1.8 3.6-1.8 2.4 0 4.4 1.7 4.4 4.2 0 3-2.4 5.2-5.8 7.4C13.6 19.6 12 21 12 21Z" />
);

export default {
  InstagramIcon,
  YoutubeIcon,
  SpotifyIcon,
  TiktokIcon,
  HeartIcon,
};

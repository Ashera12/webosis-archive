"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaExternalLinkAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';

type TrendItem = {
  id: string;
  platform: string;
  title: string;
  thumbnail?: string;
  metricLabel: string;
  metricValue: number;
  prevMetric?: number; // optional previous value to show momentum
  url?: string;
};

type Props = {
  isOpen?: boolean;
  onCloseAction?: () => void;
  items: TrendItem[];
};
export default function TrendingModal({ isOpen, onCloseAction, items }: Props) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const effectiveOpen = isOpen ?? true;
    if (!effectiveOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const effectiveOpen = isOpen ?? true;
  if (!effectiveOpen || !mounted) return null;

  const close = onCloseAction ?? (() => {});
  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={close}>
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Trending Now</h3>
          <div className="flex items-center gap-2">
            <button onClick={close} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {items.length === 0 && (
            <div className="text-center text-sm text-gray-500">Tidak ada data trending saat ini.</div>
          )}

          {items.map((it) => {
            const delta = it.prevMetric ? (it.metricValue - it.prevMetric) : null;
            const pct = delta && it.prevMetric ? Math.round((delta / it.prevMetric) * 100) : null;
            return (
              <a key={it.id} href={it.url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {it.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.thumbnail} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">—</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate font-medium text-gray-800 dark:text-gray-100">{it.title}</div>
                    <div className="text-sm text-gray-500">{it.metricLabel}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500">{it.platform}</div>
                    <div className="flex items-center gap-2">
                      {pct !== null ? (
                        <div className={`text-sm font-semibold ${delta! >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {delta! >= 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
                          {pct}%
                        </div>
                      ) : null}
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{it.metricValue}</div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

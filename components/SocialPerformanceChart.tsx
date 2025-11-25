"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
// use conservative object typing for chart options to avoid `any`
import { Line } from 'react-chartjs-2';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Stat = {
  platform: string;
  count: number;
  color?: string;
};

type Props = {
  stats?: Stat[];
  height?: number;
  loading?: boolean;
  apisConfigured?: boolean;
  missingKeys?: string[];
};

const SocialPerformanceChart: React.FC<Props> = ({ stats = [], height = 260, apisConfigured = true }) => {
  const { t } = useTranslation();
  
  // concise empty state when APIs aren't configured
  if (!apisConfigured) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center rounded-xl p-6 bg-white/60 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
          <div className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('chart.dataNotAvailable')}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('chart.dataNotConnected')} <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{t('chart.admin')}</code> {t('chart.forMoreInfo')}</div>
        </div>
      </div>
    );
  }

  // 7-day labels (deterministic)
  const days = 7;
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString());
  }

  const colorMap: Record<string, string> = {
    Instagram: '#D62976',
    YouTube: '#FF3B30',
    TikTok: '#010101',
    Spotify: '#1DB954'
  };

  const platforms = stats.length > 0 ? stats : Object.keys(colorMap).map((k) => ({ platform: k, count: 0 } as Stat));

  const datasets = platforms.map((p, idx) => {
    const base = Number(p.count) || 0;
    // deterministic gentle trend using sine for small variation (no Math.random)
    const points = labels.map((_, i) => {
      const t = i / (labels.length - 1 || 1);
      const noise = 1 + Math.sin((idx + i) * 0.8) * 0.03;
      return Math.round(base * (0.85 + t * 0.3) * noise);
    });

    const hex = p.color || colorMap[p.platform] || '#4f46e5';
    return {
      label: p.platform,
      data: points,
      borderColor: hex,
      backgroundColor: hex + '33',
      tension: 0.3,
      fill: true,
      pointRadius: 2
    };
  });

  const data = { labels, datasets };

  const options: Record<string, unknown> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as Record<string, unknown>;
            const parsed = ctx.parsed as unknown;
            const value = (typeof parsed === 'object' && parsed !== null) ? (parsed as { y?: number }).y ?? parsed : parsed;
            const v = Number(value ?? 0);
            if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
            if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
            return String(v);
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: unknown) => {
            const v = Number(value as number | string);
            if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
            if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
            return v.toString();
          }
        }
      }
    }
  };

  return (
    <div className="w-full h-full bg-transparent">
      <div style={{ height }} className="relative rounded-md overflow-hidden">
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default SocialPerformanceChart;

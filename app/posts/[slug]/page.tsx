'use client';

import { useEffect, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import MediaRenderer from '@/components/MediaRenderer';
import Link from 'next/link';
import { FaArrowLeft, FaCalendar, FaEye, FaUser, FaTag } from 'react-icons/fa';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id?: string;
  category?: string;
  tags?: string[];
  status: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
  views: number;
}

export default function PostDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await apiFetch(`/api/posts/${slug}`);
        if (!response.ok) {
          setError('Berita tidak ditemukan');
          return;
        }
        const data = await safeJson(response, { url: `/api/posts/${slug}`, method: 'GET' }).catch(() => ({}));
        setPost(data.post);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Gagal memuat berita');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat berita...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page-content">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">{error || 'Berita tidak ditemukan'}</p>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaArrowLeft />
              Kembali ke Berita
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors text-sm sm:text-base"
        >
          <FaArrowLeft />
          Kembali ke Berita
        </Link>
      </div>

      {/* Article Header */}
      <article className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Featured Media (Adaptive, no cropping) */}
          {post.featured_image && (
            <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8 md:mb-10 shadow-lg sm:shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {(() => {
                const isVideo = /\.(mp4|webm|ogg)$/i.test(post.featured_image || '');
                return (
                  <div className="flex items-center justify-center w-full" style={{ maxHeight: isVideo ? '80vh' : '70vh' }}>
                    <MediaRenderer
                      src={post.featured_image}
                      alt={post.title}
                      className={`w-full h-full ${isVideo ? 'object-contain' : 'object-contain'}`}
                      controlsForVideo={true}
                    />
                  </div>
                );
              })()}
              {post.is_featured && (
                <div className="absolute top-3 sm:top-4 md:top-5 right-3 sm:right-4 md:right-5 bg-yellow-500/90 backdrop-blur px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[10px] sm:text-xs md:text-sm font-bold text-white shadow-lg">
                  UNGGULAN
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-gray-900/0" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 md:mb-8 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FaCalendar className="text-blue-600 text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm">
                {new Date(post.published_at || post.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FaEye className="text-blue-600 text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm">{post.views || 0} views</span>
            </div>
            {post.category && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaTag className="text-blue-600 text-xs sm:text-sm" />
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                  {post.category}
                </span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="relative mb-8 sm:mb-10 md:mb-12">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 blur" />
              <div className="relative bg-white dark:bg-gray-800/70 backdrop-blur rounded-xl sm:rounded-2xl border border-indigo-200/40 dark:border-indigo-800/40 p-4 sm:p-5 md:p-7 shadow-sm">
                <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="relative">
            <div className="absolute -inset-x-4 -inset-y-2 bg-gradient-to-b from-transparent via-indigo-50/40 dark:via-indigo-900/10 to-transparent" />
            <div
              className="relative prose prose-sm sm:prose-base lg:prose-lg prose-indigo max-w-none dark:prose-invert
                prose-headings:font-semibold prose-headings:tracking-tight
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                prose-a:text-indigo-600 hover:prose-a:text-indigo-700 dark:prose-a:text-indigo-400 dark:hover:prose-a:text-indigo-300
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-img:rounded-2xl prose-img:shadow-md hover:prose-img:shadow-xl
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-900/30 prose-blockquote:py-2 prose-blockquote:px-6
                prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-pink-600 dark:prose-code:text-pink-400
                prose-pre:bg-gray-950 prose-pre:shadow-lg prose-pre:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <FaTag className="text-gray-400 text-xs sm:text-sm" />
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Bagikan Artikel
              </h3>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    const url = window.location.href;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      try {
                        await navigator.clipboard.writeText(url);
                        alert('Link berhasil disalin!');
                      } catch (err) {
                        console.error('Clipboard error:', err);
                        alert('Gagal menyalin link. Silakan copy manual.');
                      }
                    } else {
                      // Fallback for browsers without clipboard API
                      const textarea = document.createElement('textarea');
                      textarea.value = url;
                      textarea.style.position = 'fixed';
                      textarea.style.opacity = '0';
                      document.body.appendChild(textarea);
                      textarea.select();
                      try {
                        document.execCommand('copy');
                        alert('Link berhasil disalin!');
                      } catch (err) {
                        alert('Gagal menyalin link.');
                      }
                      document.body.removeChild(textarea);
                    }
                  }}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors font-medium text-sm flex-1 sm:flex-initial"
                >
                  Salin Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Back to Posts */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            <FaArrowLeft />
            Lihat Berita Lainnya
          </Link>
        </div>
      </div>
    </div>
  );
}

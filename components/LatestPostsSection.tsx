'use client';

import { useEffect, useState } from 'react';
import { getPublishedPosts } from '@/lib/supabase/client';
import AnimatedSection from './AnimatedSection';
import Image from 'next/image';
import Link from 'next/link';
import { FaCalendar, FaUser, FaEye, FaArrowRight } from 'react-icons/fa';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  views: number;
  author: {
    name: string;
    photo_url: string | null;
  } | null;
  sekbid: {
    nama: string;
    color: string;
    icon: string;
  } | null;
}

export default function LatestPostsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await getPublishedPosts(3); // Get latest 3 posts
        setPosts(data);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show section if no posts
  }

  return (
    <AnimatedSection id="latest-posts">
      <section className="py-20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-yellow-400/5 to-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="heading-primary text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-gray-100 mb-6">
              Berita <span className="text-yellow-600 dark:text-yellow-400">Terbaru</span>
            </h2>
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
              <div className="w-4 h-4 bg-yellow-400 rounded-full" />
              <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Informasi dan kegiatan terkini dari OSIS
            </p>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group block bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Featured Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-yellow-400/20 to-blue-400/20">
                  {post.featured_image ? (
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {post.sekbid?.icon || '📰'}
                    </div>
                  )}
                  
                  {/* Sekbid badge */}
                  {post.sekbid && (
                    <div
                      className="absolute top-4 right-4 px-4 py-2 rounded-full text-white text-sm font-semibold backdrop-blur-sm"
                      style={{ backgroundColor: `${post.sekbid.color}CC` }}
                    >
                      {post.sekbid.icon} {post.sekbid.nama}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <FaCalendar />
                      <span>{new Date(post.published_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaEye />
                      <span>{post.views}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {post.author && post.author.photo_url ? (
                      <Image
                        src={post.author.photo_url}
                        alt={post.author.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        {(post.author?.name || 'O').charAt(0)}
                      </div>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {post.author?.name || 'OSIS'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Lihat Semua Berita
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

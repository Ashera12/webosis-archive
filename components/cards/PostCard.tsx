'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaCalendar, FaEye } from 'react-icons/fa';

interface Author {
  name: string;
  photo_url?: string | null;
}

interface Sekbid {
  nama: string;
  icon: string;
  color: string;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featured_image?: string | null;
  published_at: string;
  views: number;
  author?: Author | null;
  sekbid?: Sekbid | null;
}

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const fallbackImage = '/images/default-post.jpg';
  const imageUrl = post.featured_image || fallbackImage;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glassmorphism Card */}
      <div className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-lg">
        
        {/* Featured Image with fixed aspect ratio */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-yellow-400/10 to-blue-400/10">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImage;
            }}
          />
          
          {/* Sekbid Badge */}
          {post.sekbid && (
            <div
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-white text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg"
              style={{ backgroundColor: `${post.sekbid.color}E6` }}
            >
              <span className="hidden sm:inline">{post.sekbid.icon} </span>
              {post.sekbid.nama}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Meta Info */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1.5">
              <FaCalendar className="text-yellow-500" />
              <span>{new Date(post.published_at).toLocaleDateString('id-ID', { 
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaEye className="text-blue-500" />
              <span>{post.views.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-tight">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-2.5 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700/50">
            {post.author?.photo_url ? (
              <Image
                src={post.author.photo_url}
                alt={post.author.name}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-yellow-400/20"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">
                {(post.author?.name || 'OSIS').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              {post.author?.name || 'OSIS'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

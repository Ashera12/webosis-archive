'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import { FaPlay, FaHeart, FaComment, FaShare, FaBookmark } from 'react-icons/fa';
import SocialMediaModal from './SocialMediaModal';

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  isPinned?: boolean;
  url?: string;
}

interface InstagramPreviewProps {
  posts: InstagramPost[];
}

export default function InstagramPreview({ posts }: InstagramPreviewProps) {
  const { t } = useTranslation();
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (postId: string) => {
    setImageErrors(prev => new Set(prev).add(postId));
  };

  const getImageSrc = (post: InstagramPost) => {
    if (imageErrors.has(post.id)) {
      // Fallback to gradient placeholder with data URI
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4MzNBQjQiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6I0UxMzA2QyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZEMUQxRCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIj5JbnN0YWdyYW08L3RleHQ+PC9zdmc+';
    }
    return post.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => setSelectedPost(post)}
          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl"
          onMouseEnter={() => setHoveredPost(post.id)}
          onMouseLeave={() => setHoveredPost(null)}
        >
          {/* Pinned Badge */}
          {post.isPinned && (
            <div className="absolute top-1.5 right-1.5 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
              <i className="fas fa-star text-[8px]"></i>
            </div>
          )}

          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
            <img
              src={getImageSrc(post)}
              alt={post.caption}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => handleImageError(post.id)}
              loading="lazy"
            />
            
            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
              hoveredPost === post.id ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                <p className="text-[10px] md:text-xs line-clamp-2 mb-1.5 md:mb-2">{post.caption}</p>
                <div className="flex items-center space-x-3 text-[10px] md:text-xs">
                  <span className="flex items-center space-x-1">
                    <FaHeart className="text-red-400 text-[10px]" />
                    <span className="font-semibold">{post.likes > 1000 ? (post.likes / 1000).toFixed(1) + 'K' : post.likes}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FaComment className="text-blue-400 text-[10px]" />
                    <span className="font-semibold">{post.comments}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Quick Stats */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
              <div className="flex items-center justify-between text-white text-[10px]">
                <span className="flex items-center space-x-1">
                  <FaHeart className="text-red-400" />
                  <span>{post.likes > 1000 ? (post.likes / 1000).toFixed(1) + 'K' : post.likes}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FaComment className="text-blue-400" />
                  <span>{post.comments}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Modal */}
    {selectedPost && (
      <SocialMediaModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        type="instagram"
        data={{
          ...selectedPost,
          uploadDate: selectedPost.date,
        }}
      />
    )}
    </>
  );
}

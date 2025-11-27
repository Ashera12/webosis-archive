'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { useToast } from '@/contexts/ToastContext';
import { FaHeart, FaRegHeart, FaClock, FaTrash, FaPaperPlane, FaReply, FaEdit, FaTimes, FaCheck, FaCommentAlt } from 'react-icons/fa';
import RoleBadge from './RoleBadge';
import Image from 'next/image';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_id?: string | null; // Supabase auth user id (unused for credential users)
  user_id?: string | null;   // Internal NextAuth user id for ownership
  author_role?: string | null; // User role for badge display
  author_photo_url?: string | null; // User profile photo
  instagram_username?: string | null; // User Instagram username
  is_anonymous: boolean;
  created_at: string;
  likes: number;
  parent_id?: string | null;
  liked_by_user?: boolean;
}

interface CommentSectionProps {
  contentId: string;
  contentType: 'post' | 'event' | 'poll' | 'announcement' | 'news';
  onCommentCountChange?: (count: number) => void;
}

export default function CommentSection({ 
  contentId, 
  contentType,
  onCommentCountChange 
}: CommentSectionProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [anonymousCommentIds, setAnonymousCommentIds] = useState<string[]>([]);

  // Load anonymous comment IDs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anonymousComments');
      if (stored) {
        try {
          setAnonymousCommentIds(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  // Debug log user role once on mount
  useEffect(() => {
    if (session?.user?.role) {
      console.log('[CommentSection] User role:', {
        raw: session.user.role,
        normalized: session.user.role.trim().toLowerCase(),
        canDeleteAll: ['admin', 'superadmin', 'osis'].includes(session.user.role.trim().toLowerCase())
      });
    }
  }, [session?.user?.role]);

  // Initial fetch for count even before toggling comment list
  useEffect(() => {
    if (contentId) {
      fetchComments();
    }
  }, [contentId]);

  // Refresh when opening comments
  useEffect(() => {
    if (showComments && contentId) {
      fetchComments();
    }
  }, [showComments, contentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/comments?contentId=${contentId}&contentType=${contentType}`);
      
      if (response.ok) {
        const data = await safeJson(response, { url: '/api/comments', method: 'GET' });
        const commentsList = data.comments || [];
        setComments(commentsList);
        onCommentCountChange?.(commentsList.length);
      } else {
        console.error('Failed to fetch comments');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      showToast('Komentar tidak boleh kosong', 'warning');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          content: newComment.trim(),
          authorName: session?.user?.name || 'Anonymous',
          parentId: null
        })
      });

      if (response.ok) {
        const data = await safeJson(response, { url: '/api/comments', method: 'POST' });
        setComments([data.comment, ...comments]);
        setNewComment('');
        showToast('Komentar berhasil ditambahkan!', 'success');
        onCommentCountChange?.(comments.length + 1);
        
        // Track anonymous comment for delete permission
        if (!session?.user && data.comment.id) {
          const newIds = [...anonymousCommentIds, data.comment.id];
          setAnonymousCommentIds(newIds);
          localStorage.setItem('anonymousComments', JSON.stringify(newIds));
        }
      } else {
        const error = await safeJson(response, { url: '/api/comments', method: 'POST' }).catch(() => ({ error: 'Gagal menambahkan komentar' }));
        showToast(error.error || 'Gagal menambahkan komentar', 'error');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      showToast('Gagal menambahkan komentar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) {
      showToast('Reply tidak boleh kosong', 'warning');
      return;
    }

    try {
      const response = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          content: replyText.trim(),
          authorName: session?.user?.name || 'Anonymous',
          parentId
        })
      });

      if (response.ok) {
        await fetchComments();
        setReplyText('');
        setReplyTo(null);
        showToast('Reply berhasil ditambahkan!', 'success');
        
        // Track anonymous reply
        if (!session?.user) {
          const data = await safeJson(response, { url: '/api/comments', method: 'POST' });
          if (data.comment?.id) {
            const newIds = [...anonymousCommentIds, data.comment.id];
            setAnonymousCommentIds(newIds);
            localStorage.setItem('anonymousComments', JSON.stringify(newIds));
          }
        }
      } else {
        showToast('Gagal menambahkan reply', 'error');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      showToast('Gagal menambahkan reply', 'error');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) {
      showToast('Komentar tidak boleh kosong', 'warning');
      return;
    }

    try {
      const response = await apiFetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText.trim() })
      });

      if (response.ok) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, content: editText.trim() } : c
        ));
        setEditingId(null);
        setEditText('');
        showToast('Komentar berhasil diupdate!', 'success');
      } else {
        showToast('Gagal mengupdate komentar', 'error');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast('Gagal mengupdate komentar', 'error');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await apiFetch(`/api/comments/${commentId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await safeJson(response, { url: `/api/comments/${commentId}/like`, method: 'POST' });
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, likes: data.likes, liked_by_user: data.liked } 
            : c
        ));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Yakin ingin menghapus komentar ini?')) return;

    // Optimistic UI update for better performance
    const originalComments = [...comments];
    setComments(comments.filter((c: Comment) => c.id !== commentId));
    onCommentCountChange?.(comments.length - 1);

    try {
      const response = await apiFetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setComments(comments.filter((c: Comment) => c.id !== commentId));
        showToast('Komentar berhasil dihapus', 'success');
        onCommentCountChange?.(comments.length - 1);
        
        // Remove from anonymous tracking
        if (anonymousCommentIds.includes(commentId)) {
          const newIds = anonymousCommentIds.filter(id => id !== commentId);
          setAnonymousCommentIds(newIds);
          localStorage.setItem('anonymousComments', JSON.stringify(newIds));
        }
      } else {
        // Revert on error
        setComments(originalComments);
        onCommentCountChange?.(originalComments.length);
        showToast('Gagal menghapus komentar', 'error');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      // Revert on error
      setComments(originalComments);
      onCommentCountChange?.(originalComments.length);
      showToast('Gagal menghapus komentar', 'error');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    // Check if user is logged in with privileged role
    if (session?.user) {
      const userRole = session.user.role?.trim()?.toLowerCase() || '';
      const isPrivileged = 
        ['admin', 'superadmin', 'osis'].includes(userRole) ||
        userRole.includes('admin') ||
        userRole.includes('osis') ||
        userRole.includes('super');
      
      const isOwner = session.user.id === comment.user_id || session.user.id === comment.author_id;
      
      return isPrivileged || isOwner;
    }
    
    // For anonymous users, check if they created this comment
    return anonymousCommentIds.includes(comment.id);
  };

  const canEditComment = (comment: Comment) => {
    if (!session?.user) return false;
    return session.user.id === comment.user_id || session.user.id === comment.author_id;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div
      key={comment.id}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
        isReply ? 'ml-12' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${
          comment.is_anonymous 
            ? 'bg-gray-400' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          {!comment.is_anonymous && comment.author_photo_url ? (
            <Image
              src={comment.author_photo_url}
              alt={comment.author_name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            comment.is_anonymous ? '?' : comment.author_name.charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white">
                {comment.author_name}
              </span>
              {!comment.is_anonymous && comment.author_role && (
                <RoleBadge role={comment.author_role} size="sm" showLabel={false} />
              )}
              {!comment.is_anonymous && comment.instagram_username && (
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda ingin mengunjungi Instagram @${comment.instagram_username}?`)) {
                      window.open(`https://instagram.com/${comment.instagram_username}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-1"
                  title={`Instagram: @${comment.instagram_username}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  IG
                </button>
              )}
              {comment.is_anonymous && (
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
                  Anonymous
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <FaClock className="text-[10px]" />
                {new Date(comment.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {canEditComment(comment) && !editingId && (
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditText(comment.content);
                  }}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  title="Edit komentar"
                >
                  <FaEdit className="text-sm" />
                </button>
              )}
              {canDeleteComment(comment) && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="Hapus komentar"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
            </div>
          </div>
          
          {/* Content or Edit Form */}
          {editingId === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateComment(comment.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <FaCheck /> Simpan
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditText('');
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm"
                >
                  <FaTimes /> Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words mb-3">
              {comment.content}
            </p>
          )}
          
          {/* Action Bar */}
          {!editingId && (
            <div className="flex items-center gap-4 text-sm">
              {/* Like Button */}
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 transition-colors ${
                  comment.liked_by_user
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                {comment.liked_by_user ? <FaHeart /> : <FaRegHeart />}
                <span>{comment.likes || 0}</span>
              </button>
              
              {/* Reply Button */}
              {!isReply && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <FaReply />
                  <span>Reply</span>
                </button>
              )}
            </div>
          )}
          
          {/* Reply Form */}
          {replyTo === comment.id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tulis reply..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <FaPaperPlane className="text-xs" /> Kirim
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText('');
                  }}
                  className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Separate parent comments and replies
  const parentComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="mt-6">
      {/* Toggle Comments Button */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
        aria-label={showComments ? 'Sembunyikan komentar' : 'Tampilkan komentar'}
      >
        <FaCommentAlt className="text-xl" />
        <span>{showComments ? 'Sembunyikan' : 'Tampilkan'} Komentar</span>
        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-sm font-bold">
          {comments.length}
        </span>
      </button>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : '?'}
              </div>
              
              <div className="flex-1">
                {/* User Info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {session?.user?.name || 'Anonymous'}
                  </span>
                  {!session && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
                      Tidak login
                    </span>
                  )}
                </div>
                
                {/* Textarea */}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tulis komentar Anda..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  disabled={submitting}
                />
                
                {/* Submit Button */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {!session && 'Komentar akan ditampilkan sebagai Anonymous'}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane className="text-sm" />
                    {submitting ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">Memuat komentar...</p>
              </div>
            ) : parentComments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400">Belum ada komentar. Jadilah yang pertama!</p>
              </div>
            ) : (
              parentComments.map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment)}
                  {/* Render Replies */}
                  {getReplies(comment.id).map(reply => renderComment(reply, true))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

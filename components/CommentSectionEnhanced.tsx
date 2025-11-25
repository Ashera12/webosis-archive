'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { useToast } from '@/contexts/ToastContext';
import { FaHeart, FaRegHeart, FaClock, FaTrash, FaPaperPlane, FaReply, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_id?: string | null;
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

    try {
      const response = await apiFetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setComments(comments.filter((c: Comment) => c.id !== commentId));
        showToast('Komentar berhasil dihapus', 'success');
        onCommentCountChange?.(comments.length - 1);
      } else {
        showToast('Gagal menghapus komentar', 'error');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast('Gagal menghapus komentar', 'error');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!session?.user) return false;
    const isAdmin = session.user.role === 'admin';
    const isOwner = session.user.id === comment.author_id;
    return isAdmin || isOwner;
  };

  const canEditComment = (comment: Comment) => {
    if (!session?.user) return false;
    return session.user.id === comment.author_id;
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
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          comment.is_anonymous 
            ? 'bg-gray-400' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          {comment.is_anonymous ? '?' : comment.author_name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white">
                {comment.author_name}
              </span>
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
      >
        <span>{showComments ? 'Sembunyikan' : 'Tampilkan'} Komentar</span>
        <span className="text-sm">({comments.length})</span>
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

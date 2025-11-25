'use client';

import { useEffect, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaBullhorn, FaCalendarAlt, FaPoll, FaNewspaper, FaFileAlt } from 'react-icons/fa';
import MediaRenderer from '@/components/MediaRenderer';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
  expires_at?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string | null; // normalized
  start_date?: string | null; // optional normalized
  location?: string;
  image_url?: string;
  registration_link?: string;
}

interface PollOption {
  id: string;
  option_text: string;
  votes: number;
  order_index: number;
}

interface Poll {
  id: string;
  question: string;
  poll_options: PollOption[];
  created_at: string;
  expires_at?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  status: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
}

export default function InfoPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [votingPoll, setVotingPoll] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Info Page] Fetching all data...');
        const [annRes, evtRes, pollRes, postsRes] = await Promise.all([
          apiFetch('/api/announcements'),
          apiFetch('/api/events'),
          apiFetch('/api/polls'),
          apiFetch('/api/posts?limit=6')
        ]);

        if (annRes.ok) {
          const data = await safeJson(annRes, { url: '/api/announcements', method: 'GET' });
          console.log('[Info Page] Announcements:', data.announcements?.length || 0);
          setAnnouncements(data.announcements || []);
        } else {
          console.error('[Info Page] Announcements error:', annRes.status);
        }

        if (evtRes.ok) {
          const data = await safeJson(evtRes, { url: '/api/events', method: 'GET' });
          console.log('[Info Page] Events raw:', data);
          console.log('[Info Page] Events count:', data.events?.length || 0);
          const normalized = (data.events || []).map((e: any) => ({
            ...e,
            event_date: e.event_date || e.start_date || null,
            start_date: e.start_date || e.event_date || null,
          }));
          console.log('[Info Page] Normalized events:', normalized.length, normalized);
          setEvents(normalized);
        } else {
          const errorData = await safeJson(evtRes, { url: '/api/events', method: 'GET' }).catch(() => ({}));
          console.error('[Info Page] Events error:', evtRes.status, errorData);
          setEvents([]); // Set empty array on error instead of leaving undefined
        }

        if (pollRes.ok) {
          const data = await safeJson(pollRes, { url: '/api/polls', method: 'GET' });
          console.log('[Info Page] Polls:', data.polls?.length || 0);
          setPolls(data.polls || []);
        } else {
          console.error('[Info Page] Polls error:', pollRes.status);
        }

        if (postsRes.ok) {
          const data = await safeJson(postsRes, { url: '/api/posts?limit=6', method: 'GET' });
          console.log('[Info Page] Posts:', data.posts?.length || 0);
          setPosts(data.posts || []);
        } else {
          console.error('[Info Page] Posts error:', postsRes.status);
        }
      } catch (error) {
        console.error('[Info Page] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Load voted polls from localStorage
    const stored = localStorage.getItem('votedPolls');
    if (stored) {
      setVotedPolls(new Set(JSON.parse(stored)));
    }
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) {
      alert('Anda sudah vote di polling ini!');
      return;
    }
    
    setVotingPoll(pollId);
    try {
      const response = await apiFetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      });
      
      const result = await safeJson(response, { url: `/api/polls/${pollId}/vote`, method: 'POST' }).catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal vote');
      }
      
      // Update local state
      setPolls(prevPolls => prevPolls.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            poll_options: poll.poll_options?.map(opt => 
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            )
          };
        }
        return poll;
      }));
      
      // Mark as voted
      const newVotedPolls = new Set(votedPolls);
      newVotedPolls.add(pollId);
      setVotedPolls(newVotedPolls);
      localStorage.setItem('votedPolls', JSON.stringify([...newVotedPolls]));
      
      alert(`Vote berhasil! (${result.voter_role})`);
    } catch (error) {
      console.error('[Info Page] Vote error:', error);
      alert('Gagal vote: ' + (error as Error).message);
    } finally {
      setVotingPoll(null);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat informasi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <FaNewspaper className="text-4xl sm:text-5xl lg:text-6xl text-blue-600 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pusat Informasi OSIS
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300">
              Temukan pengumuman, acara, polling, dan informasi terbaru dari OSIS
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Announcements Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <FaBullhorn className="text-2xl sm:text-3xl text-blue-600" />
              <h2 className="text-2xl sm:text-3xl font-bold">Pengumuman</h2>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Belum ada pengumuman</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id || ann.title}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                      ann.priority === 'urgent'
                        ? 'border-red-500'
                        : ann.priority === 'high'
                        ? 'border-orange-500'
                        : 'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {ann.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ann.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : ann.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ann.priority === 'urgent' ? 'URGENT' : ann.priority === 'high' ? 'PENTING' : 'Info'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                      {ann.content}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(ann.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Events Section */}
            <div className="flex items-center gap-3 mb-6 mt-12 sm:mt-16">
              <FaCalendarAlt className="text-2xl sm:text-3xl text-green-600" />
              <h2 className="text-2xl sm:text-3xl font-bold">Acara Mendatang</h2>
            </div>

            {events.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Belum ada acara</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {events.map((event, index) => {
                  const uniqueKey = event.id || `${event.title}-${event.event_date}-${index}`;
                  return (
                  <div
                    key={uniqueKey}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {event.image_url && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <MediaRenderer
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          controlsForVideo={true}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          📅{' '}
                          {event.event_date ? new Date(event.event_date as string).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }) : 'Tanggal belum ditetapkan'}
                        </p>
                        {event.location && <p>📍 {event.location}</p>}
                      </div>
                      {event.registration_link && (
                        <a
                          href={event.registration_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Daftar Sekarang
                        </a>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: Polls */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaPoll className="text-2xl sm:text-3xl text-purple-600" />
                  <h2 className="text-xl sm:text-2xl font-bold">Polling Aktif</h2>
                </div>

                {polls.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Belum ada polling</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {polls.map((poll) => {
                      const totalVotes = poll.poll_options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
                      const hasVoted = votedPolls.has(poll.id);
                      const isVoting = votingPoll === poll.id;
                      
                      return (
                        <div
                          key={poll.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500"
                        >
                          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                            {poll.question}
                          </h3>
                          
                          {hasVoted ? (
                            // Show results after voting
                            <div className="space-y-3">
                              {poll.poll_options?.sort((a, b) => a.order_index - b.order_index).map((option) => {
                                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                                
                                return (
                                  <div key={option.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-gray-900 dark:text-white">{option.option_text}</span>
                                      <span className="text-gray-500 dark:text-gray-400">{option.votes} votes ({percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">
                                ✓ Anda sudah vote
                              </p>
                            </div>
                          ) : (
                            // Show voting buttons before voting
                            <div className="space-y-2">
                              {poll.poll_options?.sort((a, b) => a.order_index - b.order_index).map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => handleVote(poll.id, option.id)}
                                  disabled={isVoting}
                                  className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {option.option_text}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({option.votes} votes)
                                  </span>
                                </button>
                              ))}
                              {isVoting && (
                                <p className="text-xs text-blue-600 animate-pulse">
                                  Mengirim vote...
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500">
                              Total voting: {totalVotes}
                            </p>
                            {poll.expires_at && (
                              <p className="text-xs text-orange-600">
                                Berakhir: {new Date(poll.expires_at).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Posts/Articles Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaFileAlt className="text-2xl sm:text-3xl text-indigo-600" />
                  <h2 className="text-xl sm:text-2xl font-bold">Artikel Terbaru</h2>
                </div>

                {posts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Belum ada artikel</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-5">
                      {posts.slice(0, 3).map((post) => {
                        const isVideo = /\.(mp4|webm|ogg)$/i.test(post.featured_image || '');
                        return (
                          <div
                            key={post.id || post.slug}
                            className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all overflow-hidden border border-gray-100 dark:border-gray-700"
                          >
                            {post.featured_image && (
                              <div className={`relative w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center ${isVideo ? 'aspect-video' : 'aspect-video'} max-h-56`}>
                                <MediaRenderer
                                  src={post.featured_image}
                                  alt={post.title}
                                  className={`w-full h-full ${isVideo ? 'object-contain' : 'object-cover'} transition-transform duration-500 group-hover:scale-[1.03]`}
                                  controlsForVideo={false}
                                  autoPlay={isVideo}
                                  loop={isVideo}
                                  muted={isVideo}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              </div>
                            )}
                            <div className="p-5 space-y-3">
                              <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(post.published_at || post.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                                <a
                                  href={`/posts/${post.slug}`}
                                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:underline hover:decoration-2"
                                >
                                  Baca Selengkapnya
                                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 text-center">
                      <a
                        href="/posts"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:shadow-lg hover:bg-indigo-700 transition-colors"
                      >
                        Lihat Semua Artikel
                        <span>→</span>
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

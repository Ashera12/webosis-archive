'use client';

import { useEffect, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaPoll, FaCheckCircle } from 'react-icons/fa';

interface PollOption {
  id: string;
  option_text: string;
  votes: number;
  order_index: number;
}

interface Poll {
  id: string;
  question: string;
  expires_at: string;
  poll_options: PollOption[];
}

export default function PollsWidget() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
    // Load voted polls from localStorage
    const voted = localStorage.getItem('voted_polls');
    if (voted) {
      setVotedPolls(new Set(JSON.parse(voted)));
    }
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await apiFetch('/api/polls');
      if (response.ok) {
        const data = await safeJson(response, { url: '/api/polls', method: 'GET' });
        setPolls(data.polls || []);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId) || voting) return;

    setVoting(pollId);
    try {
      const response = await apiFetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const result = await safeJson(response, { url: `/api/polls/${pollId}/vote`, method: 'POST' }).catch(() => ({}));

      if (response.ok) {
        // Update poll options with new vote counts
        setPolls(prev => prev.map(poll => {
          if (poll.id === pollId) {
            return {
              ...poll,
              poll_options: result.options || poll.poll_options,
            };
          }
          return poll;
        }));

        // Mark as voted
        const newVoted = new Set(votedPolls);
        newVoted.add(pollId);
        setVotedPolls(newVoted);
        localStorage.setItem('voted_polls', JSON.stringify([...newVoted]));

        // Show voter role
        if (result.voterRole) {
          const roleText = result.voterRole === 'anonymous' 
            ? 'Terima kasih! Vote Anda dihitung sebagai pengunjung.' 
            : `Terima kasih! Vote Anda dihitung sebagai ${result.voterRole}.`;
          alert(roleText);
        }
      } else {
        alert(result.error || 'Gagal vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Terjadi kesalahan saat voting');
    } finally {
      setVoting(null);
    }
  };

  const getTotalVotes = (options: PollOption[]) => {
    return options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <FaPoll className="text-5xl text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Polling Aktif
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (polls.length === 0) {
    return null; // Don't show section if no active polls
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <FaPoll className="text-5xl text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Polling Aktif
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Berikan suara Anda untuk topik-topik penting OSIS
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll.poll_options);
            const hasVoted = votedPolls.has(poll.id);
            const isVoting = voting === poll.id;

            return (
              <div
                key={poll.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {poll.question}
                </h3>

                <div className="space-y-3">
                  {poll.poll_options
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((option) => {
                      const percentage = getPercentage(option.votes || 0, totalVotes);
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
                          disabled={hasVoted || isVoting}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            hasVoted
                              ? 'border-gray-300 dark:border-gray-600 cursor-default'
                              : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                          } ${isVoting ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {option.option_text}
                            </span>
                            {hasVoted && (
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                {percentage}%
                              </span>
                            )}
                          </div>
                          
                          {hasVoted && (
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Total voting: {totalVotes}</span>
                  {hasVoted && (
                    <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <FaCheckCircle />
                      Anda sudah vote
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  Berakhir: {new Date(poll.expires_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

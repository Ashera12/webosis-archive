// app/test-activity/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TestActivityPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activity/timeline?limit=10');
      const json = await res.json();
      setResult({
        status: res.status,
        data: json,
        session: {
          user: session?.user,
          hasId: !!(session?.user as any)?.id,
          id: (session?.user as any)?.id
        }
      });
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activity/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'other',
          action: 'Test activity',
          description: 'Testing activity logging system',
          metadata: { test: true },
          status: 'success'
        })
      });
      const json = await res.json();
      setResult({ status: res.status, data: json });
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">🧪 Test Activity Logging</h1>
        
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Session Info:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={testFetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Fetch Activities'}
          </button>
          
          <button
            onClick={testLog}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Log Activity'}
          </button>
        </div>

        {result && (
          <div>
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

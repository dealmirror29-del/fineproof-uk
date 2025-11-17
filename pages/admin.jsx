import { useState } from 'react';

export default function Admin() {
  const [apiKey, setApiKey] = useState('');
  const [url, setUrl] = useState('');
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('');

  async function submitScan(e) {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey ? `Bearer ${apiKey}` : '',
        },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (resp.status === 202 && data.jobId) {
        setJob(data.jobId);
        setStatus('Queued — polling...');
        pollJob(data.jobId);
      } else if (resp.ok) {
        setStatus('Scan completed');
        setJob(null);
        console.log(data);
      } else {
        setStatus('Error: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      setStatus('Error: ' + String(err));
    }
  }

  async function pollJob(id) {
    const interval = setInterval(async () => {
      const r = await fetch(`/api/job/${id}`);
      if (!r.ok) return;
      const j = await r.json();
      setStatus(j.state);
      if (j.state === 'completed') {
        clearInterval(interval);
        setJob(null);
        setStatus('Completed — check console');
        console.log('result', j.returnValue);
      } else if (j.state === 'failed') {
        clearInterval(interval);
        setJob(null);
        setStatus('Failed');
      }
    }, 2000);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Scanner</h1>
      <form onSubmit={submitScan} className="space-y-4 max-w-xl">
        <label className="block">
          <div>API Key (SCAN_API_KEY)</div>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="border p-2 w-full" />
        </label>
        <label className="block">
          <div>URL to scan</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="border p-2 w-full" />
        </label>
        <div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Start Scan</button>
        </div>
      </form>
      <div className="mt-6">
        <div><strong>Status:</strong> {status}</div>
        {job && <div><strong>Job ID:</strong> {job}</div>}
      </div>
    </div>
  );
}

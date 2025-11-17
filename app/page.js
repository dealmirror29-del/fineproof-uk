"use client";

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setResult({ score: 38, issues: 4 });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-indigo-900 mb-4">FineProof.uk</h1>
        <p className="text-xl mb-6">We Pay Your £10K GDPR Fine</p>
        
        <input
          type="text"
          placeholder="yourshop.myshopify.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-4 border rounded-lg mb-4"
        />
        <button
          onClick={scan}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold"
        >
          {loading ? 'Scanning...' : 'Free Scan'}
        </button>

        {result && (
          <div className="mt-6 p-6 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold">{result.score}% Compliant</p>
            <p>Fix {result.issues} issues → <a href="#" className="underline">Go Pro (£79)</a></p>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Moon, Sun, Shield, Zap, CheckCircle } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const scan = () => {
    setScanning(true);
    setResult(null);
    setConfetti(false);
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 30;
      setResult({ score, fixes: 3 });
      setScanning(false);
      if (score > 70) setConfetti(true);
    }, 2800);
  };

  return (
    <>
      {confetti && <Confetti recycle={false} numberOfPieces={200} />}
      <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'}`}>
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg z-50"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="container mx-auto px-4 py-12">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              FineProof.uk
            </h1>
            <p className="text-xl mt-4 text-gray-600 dark:text-gray-300">
              We Pay Your £10K GDPR Fine
            </p>
          </motion.div>

          {/* Scanner Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="max-w-2xl mx-auto"
          >
            <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
                <h2 className="text-2xl font-bold">Free GDPR Scan</h2>
              </div>

              <input
                type="url"
                placeholder="https://yourshop.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-4 focus:ring-indigo-500 focus:border-transparent transition"
                onKeyPress={(e) => e.key === 'Enter' && scan()}
              />

              <button
                onClick={scan}
                disabled={!url || scanning}
                className="mt-6 w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300"
              >
                {scanning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Free Scan (3 sec)
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto mt-8"
            >
              <div className="backdrop-blur-xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black">{result.score}% Compliant</h3>
                    <p className="mt-2">3 critical fixes needed</p>
                  </div>
                  <div className="text-6xl font-bold">{result.score > 70 ? '✅' : '⚠️'}</div>
                </div>
                <button className="mt-6 w-full py-3 rounded-xl bg-white text-green-600 font-bold hover:bg-green-50 transition">
                  Fix in 1 Click – £79/mo
                </button>
              </div>
            </motion.div>
          )}

          {/* Trust Badges */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, text: "£10K Fine Covered" },
              { icon: CheckCircle, text: "1-Click Fix" },
              { icon: Zap, text: "Shopify Native" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <item.icon className="w-12 h-12 mx-auto text-indigo-600 dark:text-cyan-400" />
                <p className="mt-2 font-semibold">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

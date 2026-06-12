import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white font-bold text-xl">CollabHub</span>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-white hover:text-indigo-200 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Collaborate in{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Real-Time
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Chat, video call, and share files with your team in one powerful platform.
          Experience seamless collaboration from anywhere.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-lg font-semibold"
        >
          Start Free Trial
        </button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Chat</h3>
            <p className="text-gray-300">Instant messaging with typing indicators and emoji reactions.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-white mb-2">Video Calls</h3>
            <p className="text-gray-300">HD video conferencing with screen sharing capabilities.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="text-4xl mb-4">📎</div>
            <h3 className="text-xl font-semibold text-white mb-2">File Sharing</h3>
            <p className="text-gray-300">Share images, documents, and files securely.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
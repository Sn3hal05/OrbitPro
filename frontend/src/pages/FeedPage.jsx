import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';

export default function FeedPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aiSuggestion, setAiSuggestion] = useState('');
  const [polishing, setPolishing] = useState(false);

  const handlePolishPost = async () => {
    if (!content.trim()) {
      alert('Please write something in your post first to polish.');
      return;
    }
    setPolishing(true);
    try {
      const res = await api.post('/api/ai/rewrite', { text: content, type: 'post' });
      setAiSuggestion(res.data.rewritten);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to polish post with AI');
    } finally {
      setPolishing(false);
    }
  };

  const handleAcceptSuggestion = () => {
    setContent(aiSuggestion);
    setAiSuggestion('');
  };

  const handleDiscardSuggestion = () => {
    setAiSuggestion('');
  };

  useEffect(() => {
    const storedUserJson = localStorage.getItem('user');
    if (!storedUserJson) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUserJson);
    setCurrentUser(user);

    fetchFeed();

    // Refetches every 15s via setInterval inside useEffect (cleared on unmount)
    const interval = setInterval(() => {
      fetchFeedSilently();
    }, 15000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/posts/feed?page=1');
      setPosts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedSilently = async () => {
    try {
      const res = await api.get('/api/posts/feed?page=1');
      setPosts(res.data);
    } catch (err) {
      // Background poll silently fails without disrupting user
      console.warn('Background feed poll error:', err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;

    setPosting(true);
    setError('');
    try {
      const res = await api.post('/api/posts', { content: content.trim() });
      setPosts([res.data, ...posts]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setPosting(false);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="container" style={{ maxWidth: '720px', paddingBottom: '3rem' }}>
      <header className="feed-header">
        <div className="logo-section">
          <Link to="/feed" className="nav-logo">OrbitPro</Link>
        </div>
        <nav className="nav-actions">
          <Link to="/feed" className="nav-link active">Feed</Link>
          <Link to="/requests" className="nav-link">Requests</Link>
          {currentUser && (
            <Link to={`/profile/${currentUser.id}`} className="nav-link">Profile</Link>
          )}
          <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
        </nav>
      </header>

      {/* Post Creation Box */}
      <section className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Create a Post</h2>
        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleCreatePost}>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <textarea
              rows={3}
              placeholder="What's happening in your professional orbit?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {aiSuggestion && (
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid #7c3aed',
                borderRadius: '8px',
                padding: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <p style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: '600', marginBottom: '0.3rem' }}>
                AI Suggestion (under 200 chars):
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                "{aiSuggestion}"
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleAcceptSuggestion}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={handleDiscardSuggestion}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePolishPost}
              className="btn btn-outline btn-sm"
              disabled={polishing || !content.trim()}
              style={{ fontSize: '0.85rem' }}
            >
              {polishing ? '✨ Polishing...' : '✨ Polish with AI'}
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={posting || !content.trim()}
            >
              {posting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </section>

      {/* Post Feed List */}
      <section>
        {loading ? (
          <div className="page-spinner" style={{ minHeight: '200px' }}>Loading network updates...</div>
        ) : posts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No posts in the feed yet.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Be the first to share an update with your connections!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUser?.id}
              onPostUpdated={handlePostUpdated}
            />
          ))
        )}
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function RecommendedConnections({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStates, setConnectionStates] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!userId) return;
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Fetch recommendations and existing connections in parallel
      const [recRes, connRes] = await Promise.all([
        api.get(`/api/users/${userId}/recommendations`),
        api.get('/api/connections/mine').catch(() => ({ data: [] })),
      ]);

      setRecommendations(recRes.data);

      // Build status map from existing connections
      const states = {};
      connRes.data.forEach((c) => {
        const otherId = c.fromUser?._id === userId ? c.toUser?._id : c.fromUser?._id;
        if (otherId) {
          states[otherId] = c.status;
        }
      });
      setConnectionStates(states);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (recId) => {
    setActionLoading((prev) => ({ ...prev, [recId]: true }));
    try {
      await api.post(`/api/connections/request/${recId}`);
      setConnectionStates((prev) => ({ ...prev, [recId]: 'pending' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [recId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Finding matching peers...
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Recommended Connections</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Add your skills and bio to discover peers with aligned expertise.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>🎯</span> Recommended Connections
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Matched by semantic skills & bio embeddings
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {recommendations.map((rec) => {
          const status = connectionStates[rec._id] || 'none';
          const isConnecting = actionLoading[rec._id];

          return (
            <div
              key={rec._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--primary-glow)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {rec.name ? rec.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <Link
                    to={`/profile/${rec._id}`}
                    style={{
                      fontWeight: '600',
                      fontSize: '0.92rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rec.name}
                  </Link>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rec.bio || (rec.skills?.length ? rec.skills.join(', ') : 'OrbitPro member')}
                  </p>
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                {status === 'accepted' ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', fontWeight: '500' }}>
                    ✓ Connected
                  </span>
                ) : status === 'pending' ? (
                  <button className="btn btn-secondary btn-sm" disabled style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    Pending
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(rec._id)}
                    className="btn btn-primary btn-sm"
                    disabled={isConnecting}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    {isConnecting ? '...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

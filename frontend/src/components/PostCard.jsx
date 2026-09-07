import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function PostCard({ post, currentUserId, onPostUpdated }) {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  const author = post.author || {};
  const isLiked = post.likes?.some(
    (uid) => uid === currentUserId || uid?._id === currentUserId
  );
  const likesCount = post.likes?.length || 0;
  const comments = post.comments || [];

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.put(`/api/posts/${post._id}/like`);
      if (onPostUpdated) onPostUpdated(res.data);
    } catch (err) {
      console.error('Failed to toggle like', err);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/posts/${post._id}/comment`, {
        text: commentText.trim(),
      });
      setCommentText('');
      setShowComments(true);
      if (onPostUpdated) onPostUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <article className="card" style={{ marginBottom: '1.25rem' }}>
      {/* Post Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {author.name ? author.name[0].toUpperCase() : 'U'}
        </div>
        <div>
          <Link
            to={`/profile/${author._id}`}
            style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            {author.name || 'Anonymous User'}
          </Link>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div style={{ fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
        {post.content}
      </div>

      {/* Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
        }}
      >
        <button
          onClick={handleLike}
          disabled={liking}
          className={`btn btn-sm ${isLiked ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>💬</span>
          <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          {comments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {comments.map((comment, index) => {
                const commentAuthor = comment.author || {};
                const cDate = comment.createdAt
                  ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={comment._id || index}
                    style={{
                      background: 'rgba(25, 25, 50, 0.4)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <Link
                        to={`/profile/${commentAuthor._id}`}
                        style={{ fontSize: '0.85rem', fontWeight: '600' }}
                      >
                        {commentAuthor.name || 'Member'}
                      </Link>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cDate}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{comment.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.8rem', fontSize: '0.88rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment ? '...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

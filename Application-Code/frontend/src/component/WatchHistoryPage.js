// WatchHistoryPage.js
import React, { useState, useEffect } from 'react';
import {Link } from "react-router-dom";
import './css/WatchHistoryPage.css';

// Helper: format seconds → mm:ss
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper: relative time
const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInSec = Math.floor(diffInMs / 1000);

  if (diffInSec < 60) return 'just now';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)} minutes ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)} hours ago`;
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)} days ago`;
  if (diffInSec < 2592000) return `${Math.floor(diffInSec / 604800)} weeks ago`;
  return `${Math.floor(diffInSec / 2592000)} months ago`;
};

const WatchHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch watch history
  const fetchHistory = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
     
      
      const res = await fetch(
        `http://localhost:8000/api/v1/user/history?page=${pageNum}&limit=5`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error('Failed to fetch history');

      const json = await res.json();
      
      if (json.success) {
        const newVideos = json.data.videos || [];
        const newPagination = json.data.pagination;

        setHistory((prev) => (append ? [...prev, ...newVideos] : newVideos));
        setPagination(newPagination);
        setPage(pageNum);
      }
    } catch (err) {
      alert('Error loading history: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  // Load more videos
  const loadMore = () => {
    if (pagination?.hasNextPage) {
      fetchHistory(page + 1, true);
    }
  };

  // Remove single video from history
  const removeFromHistory = async (videoId) => {
    // if (!window.confirm('Remove this video from watch history?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/user/history/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item._id !== videoId));
      } else {
        alert('Failed to remove video');
      }
    } catch (err) {
      alert('Error removing video');
    }
  };

  // Clear all history
  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all watch history?')) return;

    try {
      const res = await fetch('http://localhost:8000/api/v1/user/clearhistory', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setHistory([]);
        setPagination(null);
      } else {
        alert('Failed to clear history');
      }
    } catch (err) {
      alert('Error clearing history');
    }
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <>
      {[...Array(6)].map((_, i) => (
        <li key={i} className="wth-video-listing-card skeleton">
          <div className="wth-video-thumbnail skeleton-thumb"></div>
          <div className="wth-video-info">
            <div className="skeleton-line title"></div>
            <div className="skeleton-line channel"></div>
            <div className="skeleton-line details"></div>
          </div>
        </li>
      ))}
    </>
  );

  return (
    <div className="wth-container">
      {/* Header */}
      <div className="wth-header">
        <h1 className="wth-title">Watch history</h1>
        <button
          onClick={clearHistory}
          className="wth-clear-btn"
          disabled={history.length === 0 || loading}
        >
          Clear all watch history
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <ul className="wth-video-listing">
          <LoadingSkeleton />
        </ul>
      ) : history.length === 0 ? (
        <div className="wth-empty">
          <p>Your watch history is empty.</p>
        </div>
      ) : (
        <>
          <ul className="wth-video-listing">
            {history.map((item) => (
              <li key={item._id} className="wth-video-listing-card">
             <Link to={`/video/${item._id}`} >
                <div className="wth-video-thumbnail">
                  <img src={item.thumbnail} alt={item.title} />
                  <span className="wth-video-length">
                    {formatDuration(item.duration)}
                  </span>
                </div>
              </Link>
                <div className="wth-video-info">
                  <h3 className="wth-video-title">{item.title}</h3>

                <Link to={`/channel/${item.owner?._id}`} className="vlsp-video-channel">
                     <div className="wth-channel-row">
                    <img
                      src={item.owner.avatar}
                      alt={item.owner.username}
                      className="wth-channel-avatar"
                    />
                    <p className="wth-video-channel">{item.owner.username}</p>
                  </div>
                </Link>

                  <p className="wth-video-details">
                    {item.views} views • {timeAgo(item.createdAt)}
                  </p>
                </div>

                {/* X Remove Button */}
                <button
                  className="wth-remove-btn"
                  onClick={() => removeFromHistory(item._id)}
                  title="Remove from history"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          {/* Load More Button - Only show if has next page */}
          {pagination?.hasNextPage && (
            <div className="wth-load-more">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="wth-load-more-btn"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WatchHistoryPage;
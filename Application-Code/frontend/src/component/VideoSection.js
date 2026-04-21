import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Make sure you have react-router-dom installed
import './css/VideoSection.css';

// Helper: Format duration
const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper: Time ago
const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInSeconds = Math.floor(diffInMs / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }
  return 'Just now';
};

const VideoSection = ({ channelId }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyVideos = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/videos/uservideo/${channelId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch videos');

        const result = await response.json();

        if (result.statusCode === 200 && result.data?.videos) {
          const formattedVideos = result.data.videos.map(video => ({
            ...video,
            timeAgo: timeAgo(video.createdAt),
            formattedDuration: formatDuration(video.duration),
          }));
          setVideos(formattedVideos);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyVideos();
  }, []);

  if (loading) {
    return <div className="video-section-container">Loading your videos...</div>;
  }

  if (error) {
    return <div className="video-section-container">Error: {error}</div>;
  }

  if (videos.length === 0) {
    return <div className="video-section-container">No videos uploaded yet.</div>;
  }

  return (
    <section className="video-section-container">
      <ul className="video-grid-list">
        {videos.map((video) => (
          <li key={video._id} className="video-card-wrapper">
            <Link to={`/video/${video._id}`} className="video-card-link">
              <div className="video-card">
                <div className="video-thumb">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    loading="lazy"
                  />
                  <span className="video-length">
                    {video.formattedDuration}
                  </span>
                </div>
                <div className="video-info">
                  <h3 className="video-title" title={video.title}>
                    {video.title}
                  </h3>
                  <p className="video-stats">
                    {video.views} views • {video.likesCount} likes • {video.timeAgo}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default VideoSection;
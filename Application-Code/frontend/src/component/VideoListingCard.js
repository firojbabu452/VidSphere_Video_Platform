import React, { useState, useEffect} from "react";
import "./css/VideoListingCard.css";
import { Link } from "react-router-dom";

const VideoListing = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState(null);
  const [noVideosMessage, setNoVideosMessage] = useState(null); // <-- new state

  const limit = 12;

  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSec = Math.floor((now - past) / 1000);

    const intervals = [
      { label: "year", sec: 31536000 },
      { label: "month", sec: 2592000 },
      { label: "day", sec: 86400 },
      { label: "hour", sec: 3600 },
      { label: "minute", sec: 60 },
      { label: "second", sec: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffInSec / interval.sec);
      if (count > 0) {
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (views) => {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toLocaleString();
  };

  const fetchVideos = async (pageNum = 1, reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setNoVideosMessage(null); // clear previous message

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/videos/getvideos?page=${pageNum}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to load videos");

      const result = await res.json();

      // CASE 1: No videos → backend returns a message inside data
      if (result.success && result.data?.message && !result.data?.videos) {
        setNoVideosMessage(result.data.message || result.message || "No videos found");
        if (reset) setVideos([]);               // clear list on first load
        setHasNextPage(false);
        return;
      }

      // CASE 2: Videos exist
      if (result.success && Array.isArray(result.data?.videos)) {
        const formattedVideos = result.data.videos.map((vid) => ({
          id: vid._id,
          thumbnail: vid.thumbnail,
          title: vid.title,
          length: formatDuration(vid.duration),
          views: formatViews(vid.views),
          timeAgo: timeAgo(vid.createdAt),
          channel_id: vid.owner?._id || "0",
          channel: vid.owner?.username || "Unknown",
          channel_avatar: vid.owner?.avatar || "",
        }));

        setVideos((prev) => (reset ? formattedVideos : [...prev, ...formattedVideos]));
        setHasNextPage(result.data.hasNextPage === true);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(1, true);
  }, []);

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      fetchVideos(page + 1);
    }
  };

  return (
    <section className="vl-video-listing-container">
      {error && <div className="vl-error-message">{error}</div>}

      {/* Show friendly message when there are no videos at all */}
      {noVideosMessage && videos.length === 0 && !loading && (
        <div className="vl-empty-state">
          <p className="vl-empty-message">{noVideosMessage}</p>
        </div>
      )}

      {/* Video grid */}
      {videos.length > 0 && (
        <ul className="vl-video-listing">
          {videos.map((video) => (
            <li key={video.id} className="vl-video-listing-card">
              <Link to={`/video/${video.id}`} className="vl-video-link">
                <div className="vl-video-thumbnail">
                  <img src={video.thumbnail} alt={video.title} />
                  <span className="vl-video-length">{video.length}</span>
                </div>
              </Link>

              <div className="vl-video-info">
                <h3 className="vl-video-title">{video.title}</h3>

                <p className="vl-video-details">
                  {video.views} Views • {video.timeAgo}
                </p>

                <Link to={`/channel/${video.channel_id}`} className="vl-channel-link">
                  <div className="vl-channel-row">
                    <img
                      src={video.channel_avatar}
                      alt={video.channel}
                      className="vl-channel-avatar"
                    />
                    <p className="vl-video-channel">{video.channel}</p>
                  </div>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Load More – only when there are videos AND there is a next page */}
      {hasNextPage && videos.length > 0 && (
        <div className="vl-load-more-container">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="vl-load-more-btn"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* End of list message */}
      {!hasNextPage && videos.length > 0 && (
        <p className="vl-no-more-videos">You've reached the end!</p>
      )}
    </section>
  );
};

export default VideoListing;
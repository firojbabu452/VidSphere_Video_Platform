import React, { useState, useEffect } from "react";
import "./css/LikeVideos.css";
import { Link } from "react-router-dom";

const LikeVideos = () => {
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch liked videos
  const fetchLikedVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/videos/getLikeVideos", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setLikedVideos(data.data);
      } else {
        setError("Failed to load liked videos");
      }
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Unlike (remove like)
  const handleUnlike = async (videoId) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/likes/toggle/v/${videoId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (result.success && result.data.isLiked === false) {
        // Remove from UI
        setLikedVideos((prev) => prev.filter((item) => item.video !== videoId));
      } else {
        alert("Could not unlike the video");
      }
    } catch (err) {
      alert("Error occurred");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLikedVideos();
  }, []);

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="likev-container">
      <div className="likev-header">
        <h2 className="likev-title">Liked Videos</h2>
        <p className="likev-count">Total: {likedVideos.length}</p>
      </div>

      {loading && <div className="likev-loading">Loading your liked videos...</div>}

      {error && <div className="likev-error">{error}</div>}

      {!loading && likedVideos.length === 0 && (
        <div className="likev-empty">You haven't liked any videos yet.</div>
      )}

      <div className="likev-grid">
        {likedVideos.map((item) => {
          const video = item.details[0]; // only one object in details array
          const owner = video.ownerDetails[0];

          return (
            <div key={item.video} className="likev-video-card">
              <Link to={`/video/${item.video}`} className="likev-thumbnail-link">
                <div className="likev-thumbnail-wrapper">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="likev-thumbnail"
                  />
                  <span className="likev-duration">
                    {formatDuration(video.duration)}
                  </span>
                </div>
              </Link>

              <div className="likev-video-info">
                <Link to={`/video/${item.video}`} className="likev-title-link">
                  <h3 className="likev-video-title">{video.title}</h3>
                </Link>

                <div className="likev-channel-info">
                  <Link to={`/channel/${owner._id}`} className="likev-channel-link">
                    <img
                      src={owner.avatar}
                      alt={owner.username}
                      className="likev-channel-avatar"
                    />
                    <span className="likev-channel-name">{owner.username}</span>
                  </Link>
                </div>

                <div className="likev-stats">
                  <span>{video.views} views</span>
                </div>

                <button
                  onClick={() => handleUnlike(item.video)}
                  className="likev-unlike-btn"
                >
                  Unlike
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LikeVideos;
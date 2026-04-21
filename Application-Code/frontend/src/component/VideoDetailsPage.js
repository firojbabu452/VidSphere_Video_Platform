// VideoDetailsPage.js
import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import "./css/VideoDetailsPage.css";

const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);
  const intervals = [
    { label: "year", sec: 31536000 },
    { label: "month", sec: 2592000 },
    { label: "day", sec: 86400 },
    { label: "hour", sec: 3600 },
    { label: "minute", sec: 60 },
    { label: "second", sec: 1 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(diffSec / interval.sec);
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }
  return "Just now";
};

const VideoDetailsPage = () => {
  const url = window.location.href;
  const videoId = url.substring(url.lastIndexOf("/") + 1);
  const { pageurl } = useParams();

  const [videoData, setVideoData] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [suggestedVideos, setSuggestedVideos] = useState([]);

  // Save Modal States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  /* -------------------- FETCH VIDEO -------------------- */
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/videos/v/${videoId}`, {
          method: "GET",
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) {
          const data = json.data;
          setVideoData(data);
          setIsLiked(data.isLiked);
          setLikesCount(data.likesCount);
          setIsSubscribed(data.owner.isSubscribed);
          setSubscribersCount(data.owner.subscribersCount);
        }
      } catch (err) {
        console.error("Fetch video error:", err);
      }
    };
    fetchVideo();
  }, [videoId, pageurl]);

  /* -------------------- FETCH SUGGESTED VIDEOS -------------------- */
  useEffect(() => {
    const fetchsuggestedVideos = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/videos/getVideosforDetailsPage/${videoId}`,
          { method: "GET", credentials: "include" }
        );
        const json = await res.json();
        if (json.success) {
          setSuggestedVideos(json.data);
        }
      } catch (err) {
        console.error("Fetch suggested videos error:", err);
      }
    };
    fetchsuggestedVideos();
  }, [videoId, pageurl]);

  /* -------------------- FETCH COMMENTS -------------------- */
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/comment/${videoId}`, {
        method: "GET",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setComments(json.data.comments || []);
        setTotalComments(json.data.totalComments || 0);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  }, [videoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, pageurl]);

  /* -------------------- LIKE HANDLER -------------------- */
  const toggleLike = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/likes/toggle/v/${videoId}`,
        { method: "POST", credentials: "include" }
      );
      const json = await res.json();
      if (json.success) {
        setIsLiked(json.data.isLiked);
        setLikesCount((prev) => (json.data.isLiked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  /* -------------------- SUBSCRIBE HANDLER -------------------- */
  const toggleSubscribe = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/subscriptions/c/${videoData.owner._id}`,
        { method: "POST", credentials: "include" }
      );
      const json = await res.json();
      if (json.success) {
        const subscribed = json.data.subscribed;
        setIsSubscribed(subscribed);
        setSubscribersCount((prev) => (subscribed ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    }
  };

  /* -------------------- COMMENT LIKE HANDLER -------------------- */
  const toggleCommentLike = async (commentId) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/likes/toggle/c/${commentId}`,
        { method: "POST", credentials: "include" }
      );
      const json = await res.json();
      if (json.success) {
        fetchComments();
      }
    } catch (err) {
      console.error("Comment like error:", err);
    }
  };

  /* -------------------- ADD COMMENT -------------------- */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const data = new FormData();
    data.append("content", newComment);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/comment/${videoId}`, {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setTotalComments((prev) => prev + 1);
        setNewComment("");
        setIsTyping(false);
        fetchComments();
      }
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  /* -------------------- DOWNLOAD & SHARE -------------------- */
  const downloadVideo = () => {
    const link = document.createElement("a");
    link.href = videoData.videoFile;
    link.download = `${videoData.title}.mp4`;
    link.click();
  };

  const shareVideo = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Video link copied to clipboard!");
  };

  /* -------------------- SAVE MODAL: OPEN & FETCH PLAYLISTS -------------------- */
  const openSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  useEffect(() => {
    if (!isSaveModalOpen || !videoId) return;

    const fetchPlaylists = async () => {
      setLoadingPlaylists(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/playlist/getPlaylistForSave/${videoId}`,
          { method: "GET", credentials: "include" }
        );
        const json = await res.json();
        if (json.success) {
          setPlaylists(json.data.playlists || []);
        }
      } catch (err) {
        console.error("Failed to load playlists:", err);
      } finally {
        setLoadingPlaylists(false);
      }
    };
    fetchPlaylists();
  }, [isSaveModalOpen, videoId]);

  /* -------------------- TOGGLE SAVE TO PLAYLIST -------------------- */
  const togglePlaylistSave = async (playlistId, currentIsSaved) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/playlist/addVideoToPlaylist/${playlistId}/${videoId}`,
        { method: "POST", credentials: "include" }
      );
      const json = await res.json();
      if (json.success) {
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlistId ? { ...p, isSaved: !currentIsSaved } : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to update playlist:", err);
      alert("Something went wrong!");
    }
  };

  /* -------------------- RENDER -------------------- */
  if (!videoData) {
    return (
      <div style={{ color: "white", padding: "40px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="vdp-video-details-page-container">
        <main className="vdp-video-main-section">
          {/* Video Player */}
          <div className="vdp-video-player-wrapper">
            <video
              controls
              width="100%"
              height="360"
              src={videoData.videoFile}
              poster={videoData.thumbnail}
            />
          </div>

          {/* Video Info */}
          <div className="vdp-video-info-section">
            <h1 className="vdp-video-title">{videoData.title}</h1>
            <div className="vdp-video-stats">
              <span>{videoData.views} Views</span> • <span>{timeAgo(videoData.createdAt)}</span>
            </div>

            {/* Action Buttons */}
            <div className="vdp-video-actions">
              <button className="vdp-btn-stats" onClick={toggleLike}>
                <svg
                  className="vdp-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isLiked ? "#5f2c82" : "currentColor"}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 .81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{likesCount}</span>
              </button>
              <button className="vdp-btn-stats" onClick={downloadVideo}>
                Download
              </button>
              <button className="vdp-btn-stats" onClick={shareVideo}>
                Share
              </button>
              <button className="vdp-btn-save" onClick={openSaveModal}>
                Save
              </button>
            </div>

            {/* Channel Box */}
            <div className="vdp-channel-subscribe">
              <div className="vdp-channel-info">
                <div className="vdp-channel-photo">
                    <Link to={`/channel/${videoData.owner?._id}`} className="suggVidChe">
                  <img src={videoData.owner.avatar} alt={videoData.owner.username} />
                  </Link>
                </div>
                <div>
                  <div className="vdp-channel-name">{videoData.owner.username}</div>
                  <div className="vdp-channel-subscribers">
                    {subscribersCount} Subscribers
                  </div>
                </div>
              </div>
              <button className="vdp-btn-subscribe" onClick={toggleSubscribe}>
                {isSubscribed ? "Unsubscribe" : "Subscribe"}
              </button>
            </div>

            {/* Description */}
            <p className="vdp-video-description">{videoData.description}</p>

            {/* Comments Section */}
            <div className="vdp-comments-section">
              <h2 className="vdp-comments-title">{totalComments} Comments</h2>

              {/* Add Comment */}
              <div className="vdp-comment-input-wrapper">
                <textarea
                  placeholder="Add a comment..."
                  className="vdp-comment-input"
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                />
                {isTyping && (
                  <div className="vdp-comment-actions">
                    <button
                      className="vdp-comment-btn vdp-comment-btn-primary"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      Comment
                    </button>
                    <button
                      className="vdp-comment-btn vdp-comment-btn-cancel"
                      onClick={() => {
                        setNewComment("");
                        setIsTyping(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Comment List */}
              <ul className="vdp-comments-list">
                {comments.map((c) => (
                  <li key={c._id} className="vdp-comment-item">
                    <img
                      src={c.owner.avatar || "/default-avatar.png"}
                      alt={c.owner.username}
                      className="vdp-comment-user-img"
                    />
                    <div className="vdp-comment-content-wrapper">
                      <div className="vdp-comment-user-info">
                        <span className="vdp-comment-username">{c.owner.username}</span>
                        <span className="vdp-comment-time">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="vdp-comment-content">{c.content}</p>
                      <div className="vdp-comment-like">
                        <button
                          onClick={() => toggleCommentLike(c._id)}
                          className="vdp-comment-like-btn"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={c.isLiked ? "#5f2c82" : "none"}
                            stroke="currentColor"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 .81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                        <span>{c.likesCount || 0}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>

        {/* Suggested Videos Sidebar */}
        <aside className="vdp-video-suggested-sidebar">
          <ul className="vdp-suggested-videos-list">
            {suggestedVideos.map((video) => (
              <li key={video._id} className="vdp-suggested-video-item">
                <a href={`/video/${video._id}`}>
                  <div className="vdp-suggested-thumbnail">
                    <img src={video.thumbnail} alt={video.title} />
                    <span className="vdp-suggested-length">
                      {Number(video.duration).toFixed(2)}
                    </span>
                  </div>
                </a>
                <div className="vdp-suggested-info">
                  <h3 className="vdp-suggested-title">{video.title}</h3>
                  <Link to={`/channel/${video.owner?._id}`} className="suggVidChe">
                    <div className="vdp-channel-row">
                      <img
                        src={video.owner.avatar}
                        alt={video.title}
                        className="vdp-channel-avatar"
                      />
                      <p className="vdp-video-channel">{video.owner.username}</p>
                    </div>
                  </Link>
                  <p className="vdp-suggested-stats">
                    {video.views} views • {timeAgo(video.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* ====================== SAVE TO PLAYLIST MODAL ====================== */}
      {isSaveModalOpen && (
        <div className="vdp-save-modal-overlay" onClick={() => setIsSaveModalOpen(false)}>
          <div className="vdp-save-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vdp-save-modal-header">
              <h3>Save video to...</h3>
              <button className="vdp-save-modal-close" onClick={() => setIsSaveModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="vdp-save-modal-body">
              {loadingPlaylists ? (
                <p>Loading playlists...</p>
              ) : playlists.length === 0 ? (
                <p style={{ color: "#aaa" }}>You don't have any playlists yet.</p>
              ) : (
                <ul className="vdp-save-playlist-list">
                  {playlists.map((pl) => (
                    <li key={pl._id} className="vdp-save-playlist-item">
                      <label className="vdp-save-playlist-label">
                        <input
                          type="checkbox"
                          checked={pl.isSaved}
                          onChange={() => togglePlaylistSave(pl._id, pl.isSaved)}
                        />
                        <span className="vdp-save-playlist-name">{pl.name}</span>
                        <span className="vdp-save-playlist-count">{pl.totalVideos} videos</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="vdp-save-modal-footer">
              <button className="vdp-save-modal-done" onClick={() => setIsSaveModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoDetailsPage;
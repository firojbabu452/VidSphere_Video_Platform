import React, { useState, useEffect } from 'react';
import './css/PlaylistSection.css';
import { Link } from "react-router-dom";
// Utility: Convert timestamp to "X time ago"
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

const PlaylistSection = ({ channelId }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // Fixed: was missing!
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const userId = channelId; // You can later replace with auth context if needed

  // Fetch playlists on mount or when userId changes
  useEffect(() => {
    if (!userId) return; // Prevent fetch if no userId
    fetchPlaylists();
  }, [userId]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/playlist/getPlaylist/${userId}`, {
        method: 'GET',
        credentials: 'include', // Sends cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPlaylists(data.data || []);
    } catch (err) {
      console.error("Error fetching playlists:", err);
      // Optional: show toast/notification here
    }
  };

  // Get thumbnail (first video or fallback)
  const getPlaylistThumbnail = (playlist) => {
    return playlist.videos.length > 0
      ? playlist.videos[0].thumbnail
      : "https://via.placeholder.com/220x124?text=No+Videos";
  };

  // Open modal with selected playlist
  const openViewModal = (playlist) => {
    setSelectedPlaylist(playlist);
    setIsViewModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedPlaylist(null);
  };

  return (
    <section className="cps-playlist-section">
      {/* Playlists Grid */}
      <ul className="cps-playlist-grid">
        {playlists.length === 0 ? (
          <p className="cps-no-playlist">No playlists yet. Create one!</p>
        ) : (
          playlists.map((p) => (
            <li
              key={p._id}
              className="cps-playlist-card"
              onClick={() => openViewModal(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openViewModal(p)}
            >
              <div className="cps-thumbnail-wrapper">
                <img
                  src={getPlaylistThumbnail(p)}
                  alt={p.name}
                  loading="lazy"
                  className="cps-playlist-thumb"
                />
                <div className="cps-overlay">
                  <span className="cps-videos">{p.videos.length} videos</span>
                  <span className="cps-meta">{p.totalViews || 0} views</span>
                </div>
              </div>

              <div className="cps-info">
                <h3 className="cps-title-text">{p.name}</h3>
                {p.description && <p className="cps-desc">{p.description}</p>}
                <small className="cps-updated">
                  Updated {timeAgo(p.updatedAt || p.createdAt)}
                </small>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* View Playlist Videos Modal */}
      {isViewModalOpen && selectedPlaylist && (
        <div className="cps-modal-overlay" onClick={closeModal}>
          <div className="cps-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="cps-modal-title">{selectedPlaylist.name}</h3>
            <p className="cps-modal-desc">
              {selectedPlaylist.description || "No description"}
            </p>

            <div className="cps-modal-meta">
              <span>{selectedPlaylist.videos.length} videos</span>
              <span>•</span>
              <span>{selectedPlaylist.totalViews || 0} total views</span>
            </div>

            {selectedPlaylist.videos.length === 0 ? (
              <p className="cps-empty-msg">No videos in this playlist yet.</p>
            ) : (
              <div className="cps-video-list">
                {selectedPlaylist.videos.map((video, index) => (
                  <div key={video._id} className="cps-video-item">
                    <div className="cps-video-index">{index + 1}</div>
                      <Link to={`/video/${video._id}`} >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="cps-video-thumb"
                      loading="lazy"
                    />
                    </Link>
                    <div className="cps-video-info">
                      <h4 className="cps-video-title">{video.title}</h4>
                      <p className="cps-video-meta">
                        {timeAgo(video.createdAt)} • {video.views} views • {video.duration || '?:??'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={closeModal} className="cps-close-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlaylistSection;
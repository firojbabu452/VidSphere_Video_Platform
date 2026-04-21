import React, { useState, useEffect } from 'react';
import './css/CreatePlaylist.css';
import { Link } from "react-router-dom";

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

const CreatePlaylist = ({ channelId }) => {
  const [playlists, setPlaylists] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const userId = channelId; // Replace with actual logged-in user ID from auth context

  // Fetch playlists on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/playlist/getPlaylist/${userId}`, {
        method: 'GET',
        credentials: 'include', // Important for sending cookies (withCredentials: true)
      });

      if (!response.ok) throw new Error('Failed to fetch playlists');
      
      const data = await response.json();
      setPlaylists(data.data || []);
    } catch (err) {
      console.error("Error fetching playlists:", err);
    }
  };

  // Create or Update Playlist
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isEditMode
      ? `http://localhost:8000/api/v1/playlist/updatePlaylist/${selectedPlaylist._id}`
      : `http://localhost:8000/api/v1/playlist/createPlaylist`;

    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Sends cookies (important for auth)
        body: JSON.stringify({
          name: formData.name,
          description: formData.description
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save playlist');
      }

    //   alert(isEditMode ? "Playlist updated successfully!" : "Playlist created successfully!");
      
      setIsCreateModalOpen(false);
      setIsEditMode(false);
      setFormData({ name: '', description: '' });
      fetchPlaylists();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save playlist");
    }
  };

  // Delete Playlist
  const handleDelete = async (playlistId) => {
    // if (!window.confirm("Are you sure you want to delete this playlist?")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/playlist/deletePlaylist/${playlistId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete');

      fetchPlaylists();
    //   alert("Playlist deleted");
    } catch (err) {
      alert("Failed to delete playlist");
    }
  };

  // Remove Video from Playlist
  const removeVideoFromPlaylist = async (videoId) => {
    // if (!window.confirm("Remove this video from playlist?")) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/playlist/removeVideoFromPlaylist/${selectedPlaylist._id}/${videoId}`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to remove video');

      fetchPlaylists(); // Refresh full list
      setSelectedPlaylist({
        ...selectedPlaylist,
        videos: selectedPlaylist.videos.filter(v => v._id !== videoId)
      });
    //   alert("Video removed");
    } catch (err) {
      alert("Failed to remove video");
    }
  };

  // Get thumbnail (first video or fallback)
  const getPlaylistThumbnail = (playlist) => {
    return playlist.videos.length > 0
      ? playlist.videos[0].thumbnail
      : "https://via.placeholder.com/220x124?text=No+Videos";
  };

  // Open Edit Modal
  const openEditModal = (playlist) => {
    setSelectedPlaylist(playlist);
    setFormData({ name: playlist.name, description: playlist.description || '' });
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  };

  // Open View Playlist Videos Modal
  const openViewModal = (playlist) => {
    setSelectedPlaylist(playlist);
    setIsViewModalOpen(true);
  };

  return (
    <section className="cps-playlist-section">
      {/* Create Playlist Button */}
      <div className="cps-header">
        <h2 className="cps-title">My Playlists</h2>
        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setIsEditMode(false);
            setFormData({ name: '', description: '' });
          }}
          className="cps-create-btn"
        >
          + Create New Playlist
        </button>
      </div>

      
      <ul className="cps-playlist-grid">
        {playlists.length === 0 ? (
          <p className="cps-no-playlist">No playlists yet. Create one!</p>
        ) : (
          playlists.map((p) => (
            <li key={p._id} className="cps-playlist-card" onClick={() => openViewModal(p)}>
              <div className="cps-thumbnail-wrapper">
                <img
                  src={getPlaylistThumbnail(p)}
                  alt={p.name}
                  loading="lazy"
                />
                <div className="cps-overlay">
                  <span className="cps-videos">{p.totalVideos || p.videos.length} videos</span>
                  <span className="cps-meta">{p.totalViews || 0} views</span>
                </div>
              </div>

              <div className="cps-info">
                <h3 className="cps-title-text">{p.name}</h3>
                {p.description && <p className="cps-desc">{p.description}</p>}
              </div>

              {/* Edit & Delete Buttons */}
              <div className="cps-actions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEditModal(p)} className="cps-edit-btn" title="Edit">✏️</button>
                <button onClick={() => handleDelete(p._id)} className="cps-delete-btn" title="Delete">🗑️</button>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="cps-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="cps-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditMode ? "Edit Playlist" : "Create New Playlist"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Playlist Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="cps-input"
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="cps-textarea"
              />
              <div className="cps-modal-actions">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="cps-cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="cps-submit-btn">
                  {isEditMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Playlist Videos Modal */}
      {isViewModalOpen && selectedPlaylist && (
        <div className="cps-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="cps-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="cps-modal-title">{selectedPlaylist.name}</h3>
            <p className="cps-modal-desc">{selectedPlaylist.description || "No description"}</p>

            {selectedPlaylist.videos.length === 0 ? (
              <p>No videos in this playlist yet.</p>
            ) : (
              <div className="cps-video-list">
                {selectedPlaylist.videos.map((video) => (
                  <div key={video._id} className="cps-video-item">
                     <Link to={`/video/${video._id}`} >
                    <img src={video.thumbnail} alt={video.title} className="cps-video-thumb" /></Link>
                    <div className="cps-video-info">
                      <h4>{video.title}</h4>
                      <p>{timeAgo(video.createdAt)} • {video.views} views</p>
                    </div>
                    <button
                      onClick={() => removeVideoFromPlaylist(video._id)}
                      className="cps-remove-video-btn"
                    >
                     X
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setIsViewModalOpen(false)} className="cps-close-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreatePlaylist;
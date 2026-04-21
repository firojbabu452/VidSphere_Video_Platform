import React, { useState, useEffect } from "react";
import "./css/CommentVideos.css";
import { Link } from "react-router-dom";

const CommentVideos = () => {
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editContent, setEditContent] = useState("");

  // Fetch all comments
  const fetchMyComments = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/comment/getAllComments", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setComments(data.data.allcomments);
        setTotalComments(data.data.totalComments);
      } else {
        setError("Failed to load comments");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCommentId("");
    setEditContent("");
  };

  // Save Edited Comment
  const handleUpdateComment = async () => {
    if (!editContent.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/comment/editComment/${editingCommentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: editContent }),
        }
      );

      const result = await res.json();

      if (result.success) {
        // Update in UI
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, content: editContent } : c
          )
        );
        closeModal();
        
      } else {
        alert("Failed to update comment");
      }
    } catch (err) {
      alert("Error updating comment");
    }
  };

  // Delete Comment
  const handleDelete = async (commentId) => {
 

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/comment/deleteComments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const result = await res.json();

      if (result.success) {
        setComments(comments.filter((c) => c._id !== commentId));
        setTotalComments(totalComments - 1);
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchMyComments();
  }, []);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="comv-container">
      <div className="comv-header">
        <h2 className="comv-title">My Comments</h2>
        <p className="comv-count">Total: {totalComments}</p>
      </div>

      {loading && <div className="comv-loading">Loading comments...</div>}
      {error && <div className="comv-error">{error}</div>}

      {!loading && comments.length === 0 && (
        <div className="comv-empty">You haven't commented on any videos yet.</div>
      )}

      <div className="comv-list">
        {comments.map((item) => {
          const video = item.videoDetails[0];

          return (
            <div key={item._id} className="comv-row">
              {/* Thumbnail */}
              <Link to={`/video/${video._id}`} className="comv-thumb-link">
                <div className="comv-thumb-wrapper">
                  <img src={video.thumbnail} alt={video.title} className="comv-thumb" />
                  <span className="comv-duration">{formatDuration(video.duration)}</span>
                </div>
              </Link>

              {/* Content */}
              <div className="comv-details">
                <Link to={`/video/${video._id}`} className="comv-video-title">
                  {video.title}
                </Link>

                <div className="comv-comment-box">
                  <p className="comv-comment-text">{item.content}</p>
                </div>

                <div className="comv-actions">
                  <button
                    onClick={() => openEditModal(item._id, item.content)}
                    className="comv-edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="comv-delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="comv-modal-overlay" onClick={closeModal}>
          <div className="comv-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Comment</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="comv-edit-textarea"
              rows="4"
              placeholder="Write your updated comment..."
            />
            <div className="comv-modal-actions">
              <button onClick={handleUpdateComment} className="comv-save-btn">
                Save Changes
              </button>
              <button onClick={closeModal} className="comv-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentVideos;
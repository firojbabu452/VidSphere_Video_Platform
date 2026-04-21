// UploadVideo.jsx
import React, { useState, useEffect } from 'react';
import './css/UploadVideo.css';

const UploadToast = ({ status, message, onHide }) => {
  useEffect(() => {
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [onHide]);

  const base = 'upv-upload-toast';
  const type = status === 'success' ? 'success' : status === 'error' ? 'error' : 'uploading';

  return (
    <div className={`${base} ${base}--${type}`}>
      {status === 'uploading' && 'Video uploading…'}
      {status === 'success' && (message || 'Video uploaded successfully!')}
      {status === 'error' && (message || 'Something went wrong.')}
    </div>
  );
};

const UploadVideo = () => {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null); // File object
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);

  // Upload feedback
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('');

  // Tags System
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const hideToast = () => {
    setUploadStatus(null);
    setToastMessage('');
  };
  const MAX_FILE_SIZE = 3 * 1024 * 1024;
  // const handleFileChange = (e) => {
  //   if (e.target.files.length > 0) setFile(e.target.files[0]);
  // };

  const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];

  if (!selectedFile) return;

  if (selectedFile.size > MAX_FILE_SIZE) {
    alert("File size must be 10MB or less.");
    return; // ❌ Stop here
  }

  setFile(selectedFile); // ✅ Save the file
};

  const handleThumbnailChange = (e) => {
    if (e.target.files.length > 0) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory || selectedTags.length === 0) {
      setUploadStatus('error');
      setToastMessage('Please select a category and at least one tag.');
      return;
    }

    setUploadStatus('uploading');
    setToastMessage('');

    const data = new FormData();
    data.append('videoFile', file);
    if (thumbnail) data.append('thumbnail', thumbnail);
    data.append('title', title);
    data.append('description', description);
    data.append('isPublished', published);
    data.append('meta_tag', JSON.stringify(selectedTags)); // Send as JSON string

    try {
      const response = await fetch('http://localhost:8000/api/v1/videos', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('success');
        setToastMessage('Video uploaded successfully!');

        // Reset all fields
        setFile(null);
        setThumbnail(null);
        setTitle('');
        setDescription('');
        setPublished(false);
        setSelectedCategory('');
        setSelectedTags([]);

        // Reset file inputs
        document.getElementById('upv-video-upload').value = '';
        document.getElementById('upv-thumbnail-input').value = '';
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      setUploadStatus('error');
      setToastMessage(err.message || 'Upload failed. Please try again.');
    }
  };

  // Categories & Tags Data
  const categories = [
    { id: '1', name: 'Food & Cooking', tags: ['food', 'cooking', 'recipe', 'street food', 'food vlog', 'food review', 'kitchen hacks', 'baking', 'dessert', 'healthy food', 'breakfast ideas', 'dinner recipes', 'food challenge', 'mukbang', 'restaurant review', 'homemade food', 'food photography'] },
    { id: '2', name: 'Nature & Travel', tags: ['nature', 'wildlife', 'travel vlog', 'forest', 'mountains', 'beach', 'sunrise', 'sunset', 'adventure', 'trekking', 'camping', 'waterfalls', 'drone shot', 'road trip', 'city tour', 'nature relaxation', '4k nature video'] },
    { id: '3', name: 'Technology & Coding', tags: ['coding', 'programming', 'javascript', 'python', 'web development', 'tech review', 'gadgets', 'AI tools', 'machine learning', 'coding tutorial', 'tech news', 'software engineering', 'ethical hacking', 'app development', 'tech comparison', 'how to code'] },
    { id: '4', name: 'Entertainment', tags: ['entertainment', 'comedy', 'funny video', 'meme video', 'reaction video', 'music', 'dance', 'movie review', 'web series', 'standup comedy', 'short film', 'entertainment news', 'parody', 'gaming entertainment'] },
    { id: '5', name: 'Gaming', tags: ['gaming', 'gameplay', 'walkthrough', 'esports', 'live gaming', 'mobile gaming', 'pc gaming', 'game review', 'game tips', 'minecraft', 'gta v', 'bgmi', 'fortnite', 'pubg', 'gaming montage'] },
    { id: '6', name: 'Education & Learning', tags: ['educational', 'study tips', 'motivation', 'exam preparation', 'how to learn', 'e-learning', 'tutorials', 'science facts', 'math tricks', 'history', 'general knowledge', 'language learning'] },
    { id: '7', name: 'Lifestyle & Daily Life', tags: ['lifestyle', 'vlog', 'morning routine', 'night routine', 'fashion', 'skincare', 'fitness', 'daily vlog', 'shopping haul', 'productivity', 'work from home', 'motivation', 'minimalism'] },
    { id: '8', name: 'Business & Finance', tags: ['business', 'entrepreneurship', 'startup', 'finance', 'stock market', 'crypto', 'investing', 'business tips', 'passive income', 'money management', 'trading', 'budget planning'] },
    { id: '9', name: 'Music & Art', tags: ['music', 'beat making', 'singing', 'instrumental', 'cover song', 'dance video', 'painting', 'drawing', 'diy art', 'craft', 'photography'] },
    { id: '10', name: 'Health & Fitness', tags: ['fitness', 'gym', 'workout', 'yoga', 'meditation', 'weight loss', 'muscle building', 'healthy lifestyle', 'mental wellness', 'diet tips'] }
  ];

  return (
    <div className="upv-upload-video-container">
      {/* Toast Notification */}
      {uploadStatus && (
        <UploadToast
          status={uploadStatus}
          message={toastMessage}
          onHide={hideToast}
        />
      )}

      <form onSubmit={handleSubmit} className="upv-upload-video-form">
        {/* Video Drop Zone */}
        <label className="upv-drop-zone" htmlFor="upv-video-upload">
          {/* <div className="upv-upload-icon">Up Arrow</div> */}
          {/* <p className="upv-drop-text">Drag and drop video files to upload</p> */}
          <p className="upv-drop-subtext">
            Your videos will be private until you publish them.
          </p>
          <button
            type="button"
            className="upv-select-file-btn"
            onClick={() => document.getElementById('upv-video-upload')?.click()}
          >
            Select Files
          </button>
          <input
            id="upv-video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            required
          />
          {file && <p className="upv-selected-file-name">Selected: {file.name}</p>}
        </label>

        {/* Thumbnail */}
        <label htmlFor="upv-thumbnail-input">Thumbnail*</label>
        <input
          id="upv-thumbnail-input"
          type="file"
          accept="image/*"
          onChange={handleThumbnailChange}
          required
        />

        {/* Title */}
        <label htmlFor="upv-title-input">Title*</label>
        <input
          id="upv-title-input"
          type="text"
          placeholder="Enter video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Description */}
        <label htmlFor="upv-description-input">Description*</label>
        <textarea
          id="upv-description-input"
          placeholder="Enter video description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Category Select */}
        <label htmlFor="upv-category-select">Category*</label>
        <select
          id="upv-category-select"
          className="upv-category-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedTags([]); // Reset tags when category changes
          }}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Tags Checkboxes (only show if category selected) */}
        {selectedCategory && (
          <div className="upv-tags-section">
            <label className="upv-tags-label">Select Tags (meta tags)*</label>
            <div className="upv-tags-grid">
              {categories
                .find((c) => c.id === selectedCategory)
                ?.tags.map((tag) => (
                  <label key={tag} className="upv-tag-checkbox-label">
                    <input
                      type="checkbox"
                      value={tag}
                      checked={selectedTags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags((prev) => [...prev, tag]);
                        } else {
                          setSelectedTags((prev) => prev.filter((t) => t !== tag));
                        }
                      }}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
            </div>
            {selectedTags.length === 0 && (
              <p className="upv-tags-warning">Please select at least one tag.</p>
            )}
          </div>
        )}

        {/* Publish Toggle */}
        <label className="upv-publish-label">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="upv-publish-checkbox"
          />
          <span className="upv-publish-text">Publish immediately</span>
        </label>

        {/* Submit Button */}
        <button
          className="upv-upload-submit-btn"
          type="submit"
          disabled={uploadStatus === 'uploading'}
        >
          {uploadStatus === 'uploading' ? 'Uploading…' : 'Upload Video'}
        </button>
      </form>

      {/* Thumbnail Preview */}
      {thumbnail && (
        <div className="upv-thumbnail-preview">
          <p>Thumbnail preview:</p>
          <img src={URL.createObjectURL(thumbnail)} alt="Thumbnail preview" />
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
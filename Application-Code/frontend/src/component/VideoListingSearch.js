import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./css/VideoListingSearch.css";

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

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

const VideoListingSearch = () => {
  const { searchTerm } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

 const fetchResults = useCallback(
  async (pageNum = 1, reset = false) => {
    if (loadingRef.current) return;

    loadingRef.current = true; 
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/search/s/${encodeURIComponent(searchTerm)}`,
        {
          params: { page: pageNum, limit: 5 },
          withCredentials: true,
        }
      );

      const responseData = res.data;
      const items =
        responseData?.data?.data ||
        responseData?.data?.docs ||
        responseData?.data ||
        responseData ||
        [];

      const pagination =
        responseData?.data?.pagination ||
        responseData?.pagination ||
        {};

      const newItems = Array.isArray(items) ? items : [];

      setResults((prev) => (reset ? newItems : [...prev, ...newItems]));
      setHasMore(pagination.hasNextPage !== false);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to load results. Please try again later.");
      if (err.response?.status === 401) {
        setError("You need to be logged in to view this content.");
      }
    } finally {
      loadingRef.current = false; 
      setLoading(false);
    }
  },
  [searchTerm]  
);


  useEffect(() => {
    if (!searchTerm) return;

    setResults([]);
    setPage(1);
    setHasMore(true);
    setError("");
    fetchResults(1, true);
  }, [searchTerm, fetchResults]);


  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchResults(nextPage);
    }
  };

  
  const toggleSubscribe = async (channelId, index) => {
    try {
      const res = await axios.post(
        `http://localhost:8000/api/v1/subscriptions/c/${channelId}`,
        {},
        { withCredentials: true } 
      );

       const { subscribed, totalSubscribers } = res.data.data;

      setResults((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].isSubscribed = subscribed;
           updated[index].subscribersCount = totalSubscribers;
        }
        return updated;
      });
    } catch (err) {
      console.error("Subscribe failed:", err);
      alert("Failed to update subscription. Please try again.");
    }
  };

  if (!searchTerm) {
    return <div className="vlsp-no-query">No search query provided.</div>;
  }

  return (
    <section className="vlsp-container">
      <div className="vlsp-header">
        <h2>
          Search results for:{" "}
          <span className="vlsp-highlight">{decodeURIComponent(searchTerm)}</span>
        </h2>
        <p>{results.length} result{results.length !== 1 ? "s" : ""} found</p>
      </div>

      {error && <div className="vlsp-error">{error}</div>}

      <ul className="vlsp-list">
        {results.map((item, index) => (
          <li key={item._id} className="vlsp-item">
            {/* CHANNEL RESULT */}
            {item.type === "channel" ? (
              <div className="vlsp-channel-card">
                <Link to={`/channel/${item._id}`} className="vlsp-channel-left">
                  <img
                    className="vlsp-channel-avatar"
                    src={item.avatar || "/default-avatar.png"}
                    alt={item.username}
                  />
                  <div>
                    <h3 className="vlsp-channel-name">{item.username}</h3>
                    <p className="vlsp-channel-stats">
                      {item.subscribersCount?.toLocaleString() || 0} subscriber
                      {item.subscribersCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>

                <button
                  className={`vlsp-sub-btn ${item.isSubscribed ? "vlsp-unsub" : ""}`}
                  onClick={() => toggleSubscribe(item._id, index)}
                  disabled={loading}
                >
                  {item.isSubscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              </div>
            ) : (
              /* VIDEO RESULT */
              <div className="vlsp-video-wrapper">
                <Link to={`/video/${item._id}`} className="vlsp-video-thumbnail">
                  <img src={item.thumbnail} alt={item.title} />
                  {item.duration && (
                    <span className="vlsp-video-duration">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </Link>

                <div className="vlsp-video-details">
                  <Link to={`/video/${item._id}`}>
                    <h3 className="vlsp-video-title">{item.title}</h3>
                  </Link>

                  <p className="vlsp-video-stats">
                    {item.views?.toLocaleString() || 0} views • {timeAgo(item.createdAt)}
                  </p>

                  <Link to={`/channel/${item.owner?._id}`} className="vlsp-video-channel">
                    <img
                      src={item.owner?.avatar || "/default-avatar.png"}
                      className="vlsp-channel-img"
                      alt={item.owner?.username}
                    />
                    <span>{item.owner?.username || "Unknown"}</span>
                  </Link>

                  {item.description && (
                    <p className="vlsp-video-description">
                      {item.description.length > 150
                        ? item.description.slice(0, 150) + "..."
                        : item.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Load More */}
      {hasMore && !loading && results.length > 0 && (
        <div className="vlsp-loadmore-container">
          <button className="vlsp-loadmore-btn" onClick={loadMore}>
            Load More
          </button>
        </div>
      )}

      {loading && <div className="vlsp-loading">Loading more results...</div>}

      {!hasMore && results.length > 0 && (
        <div className="vlsp-no-more">No more results</div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="vlsp-no-results">No results found for "{decodeURIComponent(searchTerm)}"</div>
      )}
    </section>
  );
};

export default VideoListingSearch;
import React, { useState, useEffect } from "react";
import "./css/SubscribedChannel.css";
import { Link } from "react-router-dom";

const SubscribedChannel = () => {
  const [channels, setChannels] = useState([]);
  const [totalSubscribed, setTotalSubscribed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch subscribed channels
  const fetchSubscribedChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/subscriptions/getSubscribedChannel", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setChannels(data.data.channels);
        setTotalSubscribed(data.data.totalSubscribed);
      } else {
        setError("Failed to load your subscriptions");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe button handler
  const handleUnsubscribe = async (channelId) => {

    try {
      const res = await fetch(`http://localhost:8000/api/v1/subscriptions/c/${channelId}`, {
        method: "POST",
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        // Remove from list
        setChannels(channels.filter((item) => item.channel !== channelId));
        setTotalSubscribed(totalSubscribed - 1);
      } else {
        alert("Could not unsubscribe. Try again.");
      }
    } catch (err) {
      alert("Something went wrong!");
    }
  };

  useEffect(() => {
    fetchSubscribedChannels();
  }, []);

  return (
    <div className="subc-container">
      <div className="subc-header">
        <h2 className="subc-title">Subscribed Channels</h2>
        <p className="subc-count">Total: {totalSubscribed}</p>
      </div>

      {loading && <div className="subc-loading">Loading...</div>}

      {error && <div className="subc-error">{error}</div>}

      {!loading && channels.length === 0 && (
        <div className="subc-empty">You haven't subscribed to any channels yet.</div>
      )}

      <div className="subc-list">
        {channels.map((item) => {
          const channel = item.channelDetails[0]; // only one item in array

          return (
            <div key={item.channel} className="subc-channel-card">
              <Link to={`/channel/${channel._id}`} className="subc-channel-link">
                <img src={channel.avatar} alt={channel.username} className="subc-avatar" />
                <div className="subc-info">
                  <h3 className="subc-username">{channel.username}</h3>
                  <div className="subc-stats">
                    <span>{channel.totalVideos} videos</span>
                    <span>•</span>
                    <span>{channel.totalSubscribers} subscribers</span>
                  </div>
                </div>
              </Link>

              <button
                onClick={() => handleUnsubscribe(item.channel)}
                className="subc-unsubscribe-btn"
              >
                Unsubscribe
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscribedChannel;
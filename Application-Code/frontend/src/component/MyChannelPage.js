import React, { useState, useEffect } from 'react';
import VideoSection from './VideoSection';
import PlaylistSection from './PlaylistSection';
import CreatePlaylist from './CreatePlaylist';
import UploadVideo from './UploadVideo';
import Cookies from "js-cookie";
import './css/MychanelPage.css';

const MyChannelPage = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [ismychannel, setIsmychannel] = useState(true);
  const [channelId, setChannelId] = useState('');
  

  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);


  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);


  useEffect(() => {
    const url = window.location.href;
    const lastSegment = url.substring(url.lastIndexOf("/") + 1);

    if (lastSegment === "my-channel" || lastSegment === "") {
      setIsmychannel(true);
      const userIdCookieCurrent = Cookies.get("userId");
      setChannelId(userIdCookieCurrent || '');
    } else {
      setChannelId(lastSegment);
      setIsmychannel(false);
    }
  }, []);


  useEffect(() => {
    if (!channelId) return;

    const fetchChannelDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:8000/api/v1/user/getChanneldetails/${channelId}`,
          {
            method: "GET",
            credentials: "include", 
          }
        );

        const result = await res.json();
        console.log("result.data.username"+ result.data.username);
        if (result.success && result.data) {
          const channel = result.data;
          setChannelData(channel);
          setIsSubscribed(channel.isSubcribed || false);
          setSubscribersCount(channel.subscribersCount || 0);
        }
      } catch (error) {
        console.error("Fetch channel details error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelDetails();
  }, [channelId]);


  const toggleSubscribe = async () => {
    if (!channelId || ismychannel) return; 
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/subscriptions/c/${channelId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const json = await res.json();

      if (json.success) {
        const subscribed = json.data.subscribed;
        const total = json.data.totalSubscribers;

        setIsSubscribed(subscribed);
        setSubscribersCount(total);
      }
    } catch (err) {
      console.error("Subscribe toggle error:", err);
    }
  };


 
  if (loading) {
    return <div className="my-chanel-page-container">Loading channel...</div>;
  }

  return (
    <div className="my-chanel-page-container">
      {/* Header */}
      <div className="my-chanel-header">
        <div className="my-chanel-avatar">
          <img
            src={channelData?.avatar || "https://via.placeholder.com/150"}
            alt="Channel Avatar"
          />
        </div>

        <div className="my-chanel-info">
          <h2 className="my-chanel-name">
            {ismychannel
              ? channelData?.username || "My Channel"
              : channelData?.username || `Channel: ${channelId}`}
          </h2>
          <p className="my-chanel-handle">@{channelData?.username?.toLowerCase().replace(/\s+/g, '') || 'handle'}</p>
          <p className="my-chanel-substats">
            {subscribersCount.toLocaleString()} Subscriber{subscribersCount !== 1 ? 's' : ''}
          </p>
        </div>

    
        {!ismychannel && (
          <button
            className={`vdp-btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}
            onClick={toggleSubscribe}
          >
            {isSubscribed ? "Unsubscribe" : "Subscribe"}
          </button>
        )}
      </div>

    
      <nav className="my-chanel-nav">
        <button
          className={`my-chanel-nav-item ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos
        </button>
        <button
          className={`my-chanel-nav-item ${activeTab === 'playlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlist')}
        >
          Playlists
        </button>

       
        {ismychannel && (
          <>
            <button
              className={`my-chanel-nav-item ${activeTab === 'uploadVideo' ? 'active' : ''}`}
              onClick={() => setActiveTab('uploadVideo')}
            >
              Upload Video
            </button>

          <button
              className={`my-chanel-nav-item ${activeTab === 'createPlaylist' ? 'active' : ''}`}
              onClick={() => setActiveTab('createPlaylist')}
            >
              Create Playlist
            </button>
          </>
        )}
      </nav>

  
      <section className="my-chanel-content">
        {activeTab === 'videos' && <VideoSection channelId={channelId} />}
        {activeTab === 'playlist' && <PlaylistSection channelId={channelId} />}
        {activeTab === 'uploadVideo' && ismychannel && <UploadVideo />}
        {activeTab === 'createPlaylist' && ismychannel && <CreatePlaylist channelId={channelId} />}
      </section>
    </div>
  );
};

export default MyChannelPage;
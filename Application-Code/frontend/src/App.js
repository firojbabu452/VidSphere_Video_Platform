// src/App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet ,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './component/ProtectedRoute';

import VideoListingCard from './component/VideoListingCard';
import VideoListingSearch from './component/VideoListingSearch';
import VideoDetailsPage from './component/VideoDetailsPage';
import MyChannelPage from './component/MyChannelPage';
import LoginPage from './component/LoginPage';
import RegistrationPage from './component/RegistrationPage';
import WatchHistoryPage from './component/WatchHistoryPage';
import Subscribed from './component/SubscribedChannel';
import LikeVideos from './component/LikeVideos';
import CommentVideos from './component/CommentVideos';
import SettingsPage from './component/SettingsPage';




import './App.css';

const Main = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

const Auth = () => (
  <AuthLayout>
    <Outlet />
  </AuthLayout>
);

const App = () => (
  <Router>
    <Routes>
      {/* ---- AUTH PAGES (no header / sidebar) ---- */}
      <Route element={<Auth />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
      </Route>




    <Route element={<ProtectedRoute />}>
      {/* ---- MAIN PAGES (header + sidebar) ---- */}
      <Route element={<Main />}>
        <Route path="/" element={<VideoListingCard />} />
        <Route path="/video/:id" element={<VideoDetailsPage />} />
         <Route path="/my-channel" element={<MyChannelPage key="my-channel"/>} />
        <Route path="/channel/:channelId" element={<MyChannelPage key="user-channel"/>} />
         <Route path="/my-watchhistory" element={<WatchHistoryPage />} />
        <Route path="/s/:searchTerm" element={<VideoListingSearch />} />
        <Route path="/subscribed" element={<Subscribed />} />
         <Route path="/like-videos" element={<LikeVideos/>} />
           <Route path="/commente-videos" element={<CommentVideos/>} />
            <Route path="/settings" element={<SettingsPage/>} />
         
        {/* add more routes here */}
      </Route>
    </Route>
    
    </Routes>
  </Router>
);

export default App;
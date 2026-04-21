// src/layouts/MainLayout.jsx
import React from 'react';
import Header from '../component/Header';
import Sidebar from '../component/Sidebar';

const MainLayout = ({ children }) => (
  <div className="app-container">
    <Header />
    <div className="app-body">
      <Sidebar />
      {children}
    </div>
  </div>
);

export default MainLayout;
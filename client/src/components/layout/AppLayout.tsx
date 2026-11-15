import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Navbar } from './Navbar.js';
import { ReportUploadModal } from '../reports/ReportUploadModal.js';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          onOpenUpload={() => setUploadModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Outlet context={{ openUploadModal: () => setUploadModalOpen(true) }} />
        </main>
      </div>

      {/* Canonical upload workflow dialog available across all routes */}
      <ReportUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          // Trigger optional refresh if needed
        }}
      />
    </div>
  );
};

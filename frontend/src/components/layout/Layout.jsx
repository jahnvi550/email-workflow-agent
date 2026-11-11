import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { SimulateModal } from '../inbox/SimulateModal';
import { ImportEmailModal } from '../inbox/ImportEmailModal';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { LoginModal } from '../common/LoginModal';

export const Layout = () => {
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleSimulateSuccess = () => {
    window.dispatchEvent(new CustomEvent('workflow-simulated'));
  };

  const handleImportSuccess = (res) => {
    window.dispatchEvent(new CustomEvent('email-ingested', { detail: res }));
    window.dispatchEvent(new CustomEvent('workflow-simulated'));
  };

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar 
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main View Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Ingest / Compose Email Modal */}
      <ImportEmailModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Report Download Modal */}
      <ReportDownloadModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Simulation Presets Modal */}
      <SimulateModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSuccess={handleSimulateSuccess}
      />

      {/* Mailbox Login & IMAP Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          window.location.reload();
        }}
      />

    </div>
  );
};


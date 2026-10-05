/**
 * src/views/HostelAdmin/HostelDashboard.tsx
 *
 * Backward-compatible entry wrapper for Hostel Admin views.
 * Routes to individual dedicated pages inside HostelProvider and HostelAdminLayout.
 */

import React from 'react';
import { HostelProvider } from './HostelContext';
import { HostelAdminLayout } from './HostelAdminLayout';
import { HostelOperationsHub } from './HostelOperationsHub';
import { HostelBlocksPage } from './HostelBlocksPage';
import { HostelRoomsPage } from './HostelRoomsPage';
import { HostelRequestsPage } from './HostelRequestsPage';
import { HostelAllocationsPage } from './HostelAllocationsPage';
import { HostelGatePage } from './HostelGatePage';
import { HostelComplaintsPage } from './HostelComplaintsPage';
import { HostelMessPage } from './HostelMessPage';
import { useApp } from '../../context/AppContext';

interface HostelDashboardProps {
  initialTab?: string;
}

export const HostelDashboard: React.FC<HostelDashboardProps> = ({ initialTab }) => {
  const { activeView } = useApp();

  const renderContent = () => {
    if (activeView === 'hostel_blocks' || initialTab === 'hostel_blocks' || initialTab === 'blocks') {
      return <HostelBlocksPage />;
    }
    if (activeView === 'hostel_rooms' || initialTab === 'hostel_rooms' || initialTab === 'rooms') {
      return <HostelRoomsPage />;
    }
    if (activeView === 'hostel_requests' || initialTab === 'hostel_requests' || initialTab === 'requests') {
      return <HostelRequestsPage />;
    }
    if (activeView === 'hostel_allocations' || initialTab === 'hostel_allocations' || initialTab === 'allocations') {
      return <HostelAllocationsPage />;
    }
    if (activeView === 'hostel_checkin' || initialTab === 'hostel_checkin' || initialTab === 'checkin' || initialTab === 'gate') {
      return <HostelGatePage />;
    }
    if (activeView === 'hostel_complaints' || initialTab === 'hostel_complaints' || initialTab === 'complaints' || initialTab === 'maintenance') {
      return <HostelComplaintsPage />;
    }
    if (activeView === 'hostel_reports' || initialTab === 'hostel_reports' || initialTab === 'reports' || initialTab === 'mess') {
      return <HostelMessPage />;
    }
    return <HostelOperationsHub />;
  };

  return (
    <HostelProvider>
      <HostelAdminLayout>
        {renderContent()}
      </HostelAdminLayout>
    </HostelProvider>
  );
};

export default HostelDashboard;

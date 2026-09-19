import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout as LegacyDashboardLayout } from './DashboardLayoutLegacy';
import { DashboardLayoutV2 } from './DashboardLayoutV2';

export function DashboardLayout() {
  const { user } = useAuth();
  return user?.role === 'SUPER_ADMIN' ? <DashboardLayoutV2 /> : <LegacyDashboardLayout />;
}

import React from'react';
import{useLocation}from'react-router-dom';
import{AdminNotificationsPage}from'../pages/admin/AdminNotificationsPage';
import{AdminSettingsPage}from'../pages/admin/AdminSettingsPage';
import{PlatformPageSwitch}from'./PlatformPageSwitch';

export function PlatformPanelSwitch(){
  const p=useLocation().pathname;
  if(p.endsWith('/notifications'))return <AdminNotificationsPage/>;
  if(p.endsWith('/settings'))return <AdminSettingsPage/>;
  return <PlatformPageSwitch/>;
}

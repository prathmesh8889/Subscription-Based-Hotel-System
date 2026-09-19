import React from'react';
import{Outlet,useLocation}from'react-router-dom';
import{AdminSubscriptionsPage}from'../pages/admin/AdminSubscriptionsPage';
import{AdminAnalyticsPage}from'../pages/admin/AdminAnalyticsPage';

export function PlatformPageSwitch(){
  const p=useLocation().pathname;
  if(p.endsWith('/subscriptions'))return <AdminSubscriptionsPage/>;
  if(p.endsWith('/analytics'))return <AdminAnalyticsPage/>;
  return <Outlet/>;
}

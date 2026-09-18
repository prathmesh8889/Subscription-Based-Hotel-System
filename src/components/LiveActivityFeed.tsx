// ============================================================
// Live Activity Feed - Real-time Restaurant Activity
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { socketService } from '../services/socketService';
import { 
  Activity, ShoppingCart, ChefHat, CheckCircle, 
  CreditCard, Users, Clock, TrendingUp
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'order' | 'status_change' | 'payment' | 'staff';
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

export function LiveActivityFeed() {
  const { user } = useAuth();
  const { getHotelOrders, getHotelTables } = useData();
  const hotelId = user?.hotel_id || '';
  const orders = getHotelOrders(hotelId);
  const tables = getHotelTables(hotelId);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!hotelId || !user) return;

    socketService.connect(user.id, hotelId);

    const unsubConnect = socketService.on('connection_status', (data: any) => {
      setIsConnected(data.payload.status === 'connected');
    });

    const unsubNewOrder = socketService.on('new_order', (data: any) => {
      addActivity({
        type: 'order',
        message: `New order placed at Table ${data.payload.table_number}`,
        icon: <ShoppingCart size={16} />,
        color: 'blue'
      });
    });

    const unsubStatusChange = socketService.on('order_status_changed', (data: any) => {
      const statusMessages = {
        'PREPARING': 'Order is being prepared',
        'READY': 'Order is ready for service',
        'SERVED': 'Order has been served'
      };
      addActivity({
        type: 'status_change',
        message: statusMessages[data.payload.new_status as keyof typeof statusMessages] || 'Order status updated',
        icon: <ChefHat size={16} />,
        color: 'orange'
      });
    });

    return () => {
      unsubConnect();
      unsubNewOrder();
      unsubStatusChange();
    };
  }, [hotelId, user]);

  // Add activity to feed
  const addActivity = (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20)); // Keep last 20 activities
  };

  // Initialize with recent orders
  useEffect(() => {
    if (orders.length > 0) {
      const recentActivities: ActivityItem[] = orders.slice(0, 5).map((order: any) => ({
        id: `activity-${order.id}`,
        type: 'order' as const,
        message: `Order #${order.id.slice(-6)} at Table ${order.table_number}`,
        timestamp: new Date(order.created_at),
        icon: <ShoppingCart size={16} />,
        color: 'blue'
      }));
      setActivities(recentActivities);
    }
  }, []);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Live stats
  const activeOrders = orders.filter((o: any) => o.status !== 'SERVED').length;
  const occupiedTables = tables.filter((t: any) => t.status === 'OCCUPIED').length;
  const todayRevenue = orders
    .filter((o: any) => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today && o.payment_status === 'PAID';
    })
    .reduce((sum: number, o: any) => sum + o.total_amount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-amber-500" />
          <h3 className="font-semibold text-gray-800">Live Activity</h3>
          <div className="flex items-center gap-1.5 ml-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-xs text-gray-500">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
        <span className="text-xs text-gray-400">{activities.length} events</span>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-4 px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{activeOrders}</p>
          <p className="text-xs text-gray-500">Active Orders</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{occupiedTables}</p>
          <p className="text-xs text-gray-500">Tables Occupied</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">₹{todayRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Today's Revenue</p>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-xs text-gray-400 mt-1">Activity will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((activity) => (
              <div key={activity.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClasses(activity.color)}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setActivities([])}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear activity feed
          </button>
        </div>
      )}
    </div>
  );
}

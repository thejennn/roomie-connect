import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Eye,
  Home,
  Wallet,
  ArrowUpRight,
  Clock,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LandlordLayout from '@/components/layouts/LandlordLayout';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Room {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
}

interface WalletData {
  balance: number;
}

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentPosts, setRecentPosts] = useState<Room[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    pendingPosts: 0,
    totalViews: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (!walletError && walletData) {
        setWalletBalance(walletData.balance);
      }

      // Fetch rooms/posts
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });

      if (!roomsError && roomsData) {
        setRecentPosts(roomsData.slice(0, 4));

        setStats({
          totalPosts: roomsData.length,
          activePosts: roomsData.filter(r => r.status === 'active').length,
          pendingPosts: roomsData.filter(r => r.status === 'pending').length,
          totalViews: Math.floor(Math.random() * 10000) + 5000, // Mock for now
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      label: 'Số dư ví',
      value: walletBalance,
      icon: Wallet,
      trend: 'Nhấn để nạp tiền',
      color: 'from-emerald-500 to-teal-500',
      isCurrency: true,
      onClick: () => navigate('/landlord/wallet')
    },
    {
      label: 'Tin đang đăng',
      value: stats.activePosts,
      icon: Home,
      trend: `${stats.totalPosts} tổng số`,
      color: 'from-primary to-accent',
      onClick: () => navigate('/landlord/posts')
    },
    {
      label: 'Lượt xem',
      value: stats.totalViews,
      icon: Eye,
      trend: 'Tổng lượt xem',
      color: 'from-amber-500 to-orange-500'
    },
    {
      label: 'Chờ duyệt',
      value: stats.pendingPosts,
      icon: Clock,
      trend: 'Tin đang chờ',
      color: 'from-rose-500 to-pink-500',
      onClick: () => navigate('/landlord/posts?tab=pending')
    },
  ];

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Xin chào, Chủ trọ! 👋</h1>
          <p className="text-muted-foreground mt-1">Đây là tổng quan hoạt động của bạn hôm nay</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden ${stat.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={stat.onClick}
              >
                <CardContent className="p-6">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.trend}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/landlord/create-post')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Đăng tin mới</div>
                <div className="text-sm text-muted-foreground">Tạo tin cho thuê</div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/landlord/wallet')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold">Nạp tiền</div>
                <div className="text-sm text-muted-foreground">Quản lý ví</div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/landlord/posts')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold">Quản lý tin</div>
                <div className="text-sm text-muted-foreground">Xem tất cả tin</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tin đăng gần đây
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/landlord/posts')}>
              Xem tất cả
            </Button>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Bạn chưa có tin đăng nào</p>
                <Button
                  onClick={() => navigate('/landlord/create-post')}
                  className="mt-4"
                  size="sm"
                >
                  Đăng tin đầu tiên
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/rooms/${post.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-primary">{formatCurrency(post.price)}/tháng</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : post.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : post.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status === 'active' ? 'Đang hiển thị' :
                       post.status === 'pending' ? 'Chờ duyệt' :
                       post.status === 'rejected' ? 'Bị từ chối' : 'Hết hạn'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}



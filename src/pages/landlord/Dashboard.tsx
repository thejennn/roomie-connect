import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Eye, 
  Home, 
  Wallet,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LandlordLayout from '@/components/layouts/LandlordLayout';
import { formatCurrency } from '@/lib/utils';

const stats = [
  { label: 'Số dư ví', value: 5000000, icon: Wallet, trend: '+2.5M tuần này', color: 'from-emerald-500 to-teal-500' },
  { label: 'Tin đang đăng', value: 8, icon: Home, trend: '+2 tin mới', color: 'from-primary to-accent' },
  { label: 'Lượt xem', value: 12450, icon: Eye, trend: '+15% so với tuần trước', color: 'from-amber-500 to-orange-500' },
  { label: 'Liên hệ', value: 45, icon: TrendingUp, trend: '+12 hôm nay', color: 'from-rose-500 to-pink-500' },
];

const recentPosts = [
  { id: '1', title: 'Studio khép kín full nội thất gần FPT', views: 1250, status: 'active', price: 3500000 },
  { id: '2', title: 'Căn hộ mini view đẹp, ban công thoáng', views: 890, status: 'active', price: 4000000 },
  { id: '3', title: 'Penthouse mini view toàn cảnh Hòa Lạc', views: 2100, status: 'pending', price: 6000000 },
  { id: '4', title: 'Phòng master trong nhà nguyên căn', views: 670, status: 'active', price: 3200000 },
];

export default function LandlordDashboard() {
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
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.label === 'Số dư ví' ? formatCurrency(stat.value) : stat.value.toLocaleString()}
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

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tin đăng gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div 
                  key={post.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{post.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.views.toLocaleString()} lượt xem
                      </span>
                      <span className="font-medium text-primary">{formatCurrency(post.price)}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    post.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {post.status === 'active' ? 'Đang hiển thị' : 'Chờ duyệt'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}



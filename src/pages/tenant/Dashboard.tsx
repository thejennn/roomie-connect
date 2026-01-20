import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Home, 
  Users,
  ArrowRight,
  TrendingUp,
  MapPin,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TenantLayout from '@/components/layouts/TenantLayout';
import { formatCurrency } from '@/lib/utils';

const quickStats = [
  { label: 'Phòng phù hợp', value: 45, icon: Home },
  { label: 'Bạn ở ghép tiềm năng', value: 12, icon: Users },
  { label: 'Token AI còn lại', value: '18/20', icon: Sparkles },
];

const featuredRooms = [
  { id: '1', title: 'Studio khép kín gần FPT', price: 3500000, district: 'Thạch Hòa', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop' },
  { id: '3', title: 'Căn hộ mini view đẹp', price: 4000000, district: 'Thạch Hòa', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop' },
  { id: '5', title: 'Studio cao cấp full tiện nghi', price: 5500000, district: 'Thạch Hòa', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop' },
];

const notifications = [
  { id: '1', title: 'Có người muốn kết nối với bạn!', message: 'Minh Anh - SV FPT muốn tìm bạn ở ghép', time: '5 phút trước', type: 'match' },
  { id: '2', title: 'Phòng mới phù hợp với bạn', message: 'Studio 3.5tr gần FPT vừa được đăng', time: '1 giờ trước', type: 'room' },
  { id: '3', title: 'Hồ sơ của bạn được xem', message: '3 người đã xem hồ sơ tìm bạn ở ghép', time: '2 giờ trước', type: 'view' },
];

export default function TenantDashboard() {
  return (
    <TenantLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Xin chào! 👋</h1>
          <p className="text-muted-foreground mt-1">Hãy bắt đầu tìm kiếm nơi ở lý tưởng của bạn</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="group hover:shadow-elevated transition-all cursor-pointer border-2 hover:border-primary">
              <Link to="/tenant/find-room">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg group-hover:scale-110 transition-transform">
                      <Search className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">Tìm phòng trọ</h3>
                      <p className="text-muted-foreground">Khám phá hàng trăm phòng trọ phù hợp</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="group hover:shadow-elevated transition-all cursor-pointer border-2 hover:border-accent">
              <Link to="/tenant/ai-search">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">AI Trợ lý</h3>
                        <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">Pro</span>
                      </div>
                      <p className="text-muted-foreground">Chat với AI để tìm phòng & bạn ở ghép</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Notifications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Thông báo mới
              </h3>
              <Button variant="ghost" size="sm">Xem tất cả</Button>
            </div>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${
                    notif.type === 'match' ? 'bg-pink-100 text-pink-600' :
                    notif.type === 'room' ? 'bg-primary/10 text-primary' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {notif.type === 'match' ? <Users className="h-4 w-4" /> :
                     notif.type === 'room' ? <Home className="h-4 w-4" /> :
                     <TrendingUp className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{notif.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{notif.message}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{notif.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Rooms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Phòng nổi bật</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tenant/find-room">Xem tất cả</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Link to={`/rooms/${room.id}`}>
                  <Card className="overflow-hidden group hover:shadow-elevated transition-all">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={room.image} 
                        alt={room.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium truncate">{room.title}</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {room.district}
                      </div>
                      <div className="text-lg font-bold text-primary mt-2">
                        {formatCurrency(room.price)}<span className="text-sm font-normal text-muted-foreground">/tháng</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}



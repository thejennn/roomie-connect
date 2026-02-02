import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Heart, 
  Clock, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  Star
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MENU_ITEMS = [
  { icon: Heart, label: 'Phòng đã lưu', badge: '3' },
  { icon: Clock, label: 'Lịch sử xem' },
  { icon: Bell, label: 'Thông báo', badge: '2' },
  { icon: Shield, label: 'Quyền riêng tư' },
  { icon: Star, label: 'Đánh giá ứng dụng' },
  { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ' },
  { icon: Settings, label: 'Cài đặt' },
];

export default function Profile() {
  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-10 w-10 text-primary-foreground" />
              </div>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-card border-2 border-background flex items-center justify-center shadow-card">
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Người dùng</h2>
              <p className="text-muted-foreground text-sm">Chưa đăng nhập</p>
              <Badge variant="secondary" className="mt-2">
                Tài khoản miễn phí
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="flex-1 rounded-full">
              Đăng nhập
            </Button>
            <Button variant="outline" className="flex-1 rounded-full">
              Đăng ký
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text">3</p>
            <p className="text-xs text-muted-foreground">Phòng đã lưu</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text">12</p>
            <p className="text-xs text-muted-foreground">Lượt xem</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text">5</p>
            <p className="text-xs text-muted-foreground">Match</p>
          </motion.div>
        </div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-3xl overflow-hidden divide-y divide-border/50"
        >
          {MENU_ITEMS.map((item, index) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="bg-primary/10 text-primary border-0">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            className="w-full rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Đăng xuất
          </Button>
        </motion.div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Nốc Nốc v1.0.0 • Made with ❤️ for students
        </p>
      </div>
    </Layout>
  );
}



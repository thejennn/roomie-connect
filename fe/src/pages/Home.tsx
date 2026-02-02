import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, TrendingDown, ArrowRight, MapPin, Bell } from 'lucide-react';
import { Layout } from '@/components/Layout';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <Layout>
      <div className="container py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="space-y-6"
        >
          {/* Greeting */}
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chào bạn! 👋</h1>
              <p className="text-muted-foreground">Hôm nay bạn cần gì?</p>
            </div>
            <button className="relative p-3 rounded-full bg-card shadow-card">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Find Room - Large Card */}
            <motion.div variants={fadeUp} className="col-span-2 md:col-span-1">
              <Link to="/find-room" className="block group">
                <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-card">
                  <img
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop"
                    alt="Phòng trọ"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Tìm Phòng Trọ</h3>
                    <p className="text-white/80 text-sm">100+ phòng gần trường</p>
                  </div>
                  <div className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Find Roommate - Large Card */}
            <motion.div variants={fadeUp} className="col-span-2 md:col-span-1">
              <Link to="/find-roommate" className="block group">
                <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-card">
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"
                    alt="Bạn ở ghép"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Tìm Bạn Ở Ghép</h3>
                    <p className="text-white/80 text-sm">Match theo tính cách</p>
                  </div>
                  <div className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Price Trend - Small Card */}
            <motion.div variants={fadeUp} className="col-span-2">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-match-high/10">
                  <TrendingDown className="h-6 w-6 text-match-high" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Dự báo giá phòng</p>
                  <p className="text-sm text-muted-foreground">
                    Giá phòng đang <span className="text-match-high font-medium">giảm nhẹ</span> tại Tân Xã
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">156</p>
              <p className="text-xs text-muted-foreground">Phòng còn trống</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">2.5tr</p>
              <p className="text-xs text-muted-foreground">Giá trung bình</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">89%</p>
              <p className="text-xs text-muted-foreground">Match thành công</p>
            </div>
          </motion.div>

          {/* Hot Areas */}
          <motion.div variants={fadeUp}>
            <h2 className="text-lg font-bold mb-4">Khu vực hot 🔥</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {['Gần FPT University', 'Gần ĐHQG', 'Tân Xã', 'Thạch Hoà', 'Hola Park'].map((area) => (
                <Link
                  key={area}
                  to={`/find-room?area=${encodeURIComponent(area)}`}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full glass-card hover:shadow-elevated transition-shadow"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium whitespace-nowrap">{area}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}



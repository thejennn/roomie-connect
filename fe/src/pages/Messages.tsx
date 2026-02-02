import { motion } from 'framer-motion';
import { MessageCircle, Search } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';

const MOCK_CONVERSATIONS = [
  {
    id: '1',
    name: 'Minh Anh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Bạn ơi phòng còn không?',
    time: '2 phút',
    unread: 2,
  },
  {
    id: '2',
    name: 'Cô Lan (Chủ trọ)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Phòng trống từ tuần sau em nhé',
    time: '1 giờ',
    unread: 0,
  },
  {
    id: '3',
    name: 'Hoàng Long',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Ok bạn, mình hẹn gặp cuối tuần nhé!',
    time: 'Hôm qua',
    unread: 0,
  },
];

export default function Messages() {
  return (
    <Layout>
      <div className="container py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tin nhắn</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="pl-10 rounded-full bg-card"
          />
        </div>

        {/* Conversations */}
        <div className="space-y-2">
          {MOCK_CONVERSATIONS.map((conv, index) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-elevated transition-shadow text-left"
            >
              <div className="relative">
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {conv.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {conv.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{conv.name}</h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{conv.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Empty State Hint */}
        <div className="text-center pt-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Bắt đầu cuộc trò chuyện mới bằng cách liên hệ chủ trọ hoặc bạn ở ghép!
          </p>
        </div>
      </div>
    </Layout>
  );
}



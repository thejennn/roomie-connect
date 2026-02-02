import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Coins,
  Plus,
  Bot,
  User,
  Home,
  Users,
  MapPin,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TenantLayout from '@/components/layouts/TenantLayout';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: { type: 'room' | 'roommate'; items: RoomSuggestion[] | RoommateSuggestion[] };
}

interface RoomSuggestion {
  id: string;
  title: string;
  price: number;
  district: string;
  image: string;
}

interface RoommateSuggestion {
  id: string;
  name: string;
  university: string;
  traits: string[];
  avatar: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Xin chào! Tôi là AI trợ lý của Nốc Nốc 🏠\n\nTôi có thể giúp bạn:\n• Tìm phòng trọ phù hợp\n• Tìm bạn ở ghép hợp tính cách\n• Tư vấn về khu vực Hòa Lạc\n\nBạn muốn tìm kiếm gì?',
    timestamp: new Date(),
  }
];

const mockRooms: RoomSuggestion[] = [
  { id: '1', title: 'Studio khép kín gần FPT', price: 3500000, district: 'Thạch Hòa', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=150&fit=crop' },
  { id: '3', title: 'Căn hộ mini view đẹp', price: 4000000, district: 'Thạch Hòa', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=150&fit=crop' },
  { id: '11', title: 'Studio mới xây 100%', price: 4200000, district: 'Thạch Hòa', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop' },
];

const mockRoommates: RoommateSuggestion[] = [
  { id: '1', name: 'Minh Anh', university: 'FPT University', traits: ['Sạch sẽ', 'Ngủ sớm', 'Yên tĩnh'], avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
  { id: '2', name: 'Hoàng Long', university: 'ĐHQG Hà Nội', traits: ['Thân thiện', 'Nấu ăn giỏi', 'Flexible'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
  { id: '3', name: 'Thu Hà', university: 'FPT University', traits: ['Gọn gàng', 'Hướng ngoại', 'Thể thao'], avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
];

export default function AISearch() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [tokens, setTokens] = useState(18);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (tokens <= 0) {
      toast.error('Hết token! Vui lòng mua thêm để tiếp tục.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setTokens((prev) => prev - 1);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let response: Message;
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes('phòng') || lowerInput.includes('trọ') || lowerInput.includes('thuê')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Tuyệt vời! Dựa trên yêu cầu của bạn, tôi tìm thấy một số phòng phù hợp:\n\n🏠 Các phòng này đều gần FPT University, có đầy đủ tiện nghi và giá cả hợp lý.',
          timestamp: new Date(),
          suggestions: { type: 'room', items: mockRooms },
        };
      } else if (lowerInput.includes('bạn') || lowerInput.includes('ở ghép') || lowerInput.includes('roommate')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Tôi tìm thấy một số bạn ở ghép tiềm năng phù hợp với bạn:\n\n👥 Các bạn này có lối sống và thói quen tương tự với bạn.',
          timestamp: new Date(),
          suggestions: { type: 'roommate', items: mockRoommates },
        };
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Cảm ơn bạn đã chia sẻ! Để tôi có thể giúp bạn tốt hơn:\n\n• Bạn muốn **tìm phòng** hay **tìm bạn ở ghép**?\n• Ngân sách của bạn khoảng bao nhiêu?\n• Bạn học/làm ở đâu?\n\nHãy cho tôi biết thêm nhé! 😊',
          timestamp: new Date(),
        };
      }

      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <TenantLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              AI Trợ lý
            </h1>
            <p className="text-muted-foreground text-sm">Chat với AI để tìm phòng & bạn ở ghép</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{tokens}/20</span>
              <span className="text-sm text-muted-foreground">tokens</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.info('Tính năng đang phát triển')}>
              <Plus className="h-4 w-4 mr-1" />
              Mua thêm
            </Button>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-primary to-accent text-white' 
                      : 'bg-muted'
                  }`}>
                    {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.role === 'assistant' 
                        ? 'bg-muted text-left' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.type === 'room' && (
                          <div className="grid gap-2">
                            {(message.suggestions.items as RoomSuggestion[]).map((room) => (
                              <div 
                                key={room.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:border-primary transition-all cursor-pointer"
                              >
                                <img 
                                  src={room.image} 
                                  alt={room.title} 
                                  className="w-16 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-sm">{room.title}</div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {room.district}
                                  </div>
                                </div>
                                <div className="text-primary font-semibold text-sm">
                                  {formatCurrency(room.price)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {message.suggestions.type === 'roommate' && (
                          <div className="grid gap-2">
                            {(message.suggestions.items as RoommateSuggestion[]).map((mate) => (
                              <div 
                                key={mate.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:border-accent transition-all cursor-pointer"
                              >
                                <img 
                                  src={mate.avatar} 
                                  alt={mate.name} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-sm">{mate.name}</div>
                                  <div className="text-xs text-muted-foreground">{mate.university}</div>
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {mate.traits.slice(0, 2).map((trait) => (
                                    <Badge key={trait} variant="secondary" className="text-xs">
                                      {trait}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Nhập tin nhắn... (VD: Tìm phòng gần FPT giá 3 triệu)"
                className="rounded-full"
                disabled={tokens <= 0}
              />
              <Button 
                onClick={handleSend} 
                className="rounded-full shrink-0"
                disabled={!input.trim() || tokens <= 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {tokens <= 0 && (
              <p className="text-center text-sm text-destructive mt-2">
                Bạn đã hết token! Mua thêm để tiếp tục sử dụng AI.
              </p>
            )}
          </div>
        </Card>
      </div>
    </TenantLayout>
  );
}



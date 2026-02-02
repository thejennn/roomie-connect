// src/pages/tenant/AIChat.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

type Msg = { who: 'user' | 'bot', text: string };

export default function TenantAIChat() {
  const { aiTokens, useAiToken } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { who: 'bot', text: 'Xin chào! Tôi có thể đề xuất phòng giúp bạn. Mỗi tin nhắn tiêu tốn 1 token.' }
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await apiClient.getRooms({ status: 'active' });
      if (error) {
        throw new Error(error);
      }
      setRooms(data?.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Không thể tải danh sách phòng');
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    if (aiTokens <= 0) { alert('Hết token. Vui lòng nạp thêm.'); return; }
    const ok = useAiToken();
    if (!ok) { alert('Hết token.'); return; }
    setMessages((m) => [...m, { who: 'user', text }]);
    setText('');
    setLoading(true);
    // mock response delay
    setTimeout(() => {
      // simple mock: suggest rooms in Thạch Hòa first
      const suggestions = rooms.filter(r => r.district?.includes('Thạch Hòa')).slice(0, 3);
      const reply = suggestions.length
        ? `Gợi ý phòng tại Hòa Lạc:\n- ${suggestions.map(s => `${s.title} — ${(s.price/1000000).toFixed(1)}tr (${s.address})`).join('\n- ')}`
        : 'Mình chưa tìm thấy phòng phù hợp ở Hòa Lạc. Thử điều chỉnh bộ lọc.';
      setMessages((m) => [...m, { who: 'bot', text: reply }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="container py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">AI Chat — Gợi ý phòng</h1>
      <div className="mb-2 text-sm text-muted-foreground">Tokens còn lại: <strong>{aiTokens}</strong></div>
      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl ${m.who === 'bot' ? 'bg-card' : 'bg-primary/10 self-end'}`}>
            <div className={`${m.who === 'bot' ? 'text-muted-foreground' : ''}`}>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input placeholder={aiTokens > 0 ? 'Gõ yêu cầu...' : 'Hết token'} value={text} onChange={(e) => setText(e.target.value)} disabled={aiTokens <= 0 || loading} />
        <Button onClick={send} disabled={aiTokens <= 0 || loading}>{loading ? 'Đang...' : 'Gửi'}</Button>
      </div>
    </div>
  );
}


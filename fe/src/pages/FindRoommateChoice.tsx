import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

export default function FindRoommateChoice() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hasPreferences, setHasPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      // Reset state on each run to prevent session leakage
      setHasPreferences(false);
      setLoading(true);

      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await apiClient.getMyRoommateProfile();
        if (data?.profile?.preferences && Object.keys(data.profile.preferences).length > 0) {
          setHasPreferences(true);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [isAuthenticated]);

  const goQuiz = () => navigate('/quiz');
  const goMatches = () => navigate('/matches');

  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      navigate('/auth/login?returnTo=/find-roommate');
      return;
    }
    if (hasPreferences) {
      goMatches();
    } else {
      goQuiz();
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Bạn muốn tìm bạn ở ghép bằng cách nào?</h1>
        <p className="text-muted-foreground mb-6">Chọn một trong hai phương pháp dưới đây để tiếp tục.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border-primary/20 bg-primary/5">
            <div className="flex items-center gap-4 mb-4">
              <Sparkles className="h-10 w-10 text-primary" />
              <div>
                <h2 className="font-semibold text-lg">Bộ câu hỏi trắc nghiệm</h2>
                <p className="text-sm text-muted-foreground">Sử dụng bộ câu hỏi được biên soạn để tìm roommate phù hợp.</p>
              </div>
            </div>
            <Button onClick={handleStartQuiz} className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Đang tải..." : (hasPreferences ? "Xem kết quả Match" : "Trả lời bộ câu hỏi")}
            </Button>
          </div>

          <div className="glass-card p-6 rounded-2xl border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-4 mb-4">
              <Bot className="h-10 w-10 text-amber-500" />
              <div>
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  Sử dụng AI Chatbot
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">VIP</span>
                </h2>
                <p className="text-sm text-muted-foreground">AI sẽ gợi ý nhanh các ứng viên phù hợp. (Dịch vụ VIP)</p>
              </div>
            </div>
            <Button onClick={() => navigate('/tenant/ai-chat')} variant="outline" className="w-full rounded-full border-amber-500/50 hover:bg-amber-500/10" size="lg">Mở AI Chatbot (VIP)</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
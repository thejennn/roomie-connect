import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Moon, Sun, Sunrise, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuizPreferences } from '@/types';
import { cn } from '@/lib/utils';

interface QuizOption {
  value: string;
  label: string;
  emoji: string;
  description?: string;
}

interface QuizStep {
  id: keyof QuizPreferences;
  question: string;
  category: string;
  options: QuizOption[];
}

const QUIZ_STEPS: QuizStep[] = [
  // Step 1: Basics
  {
    id: 'sleepTime',
    category: 'Cơ bản',
    question: 'Bạn thường đi ngủ lúc mấy giờ?',
    options: [
      { value: 'early', label: 'Trước 22h', emoji: '🌅', description: 'Kiểu người ngủ sớm dậy sớm' },
      { value: 'normal', label: '22h - 24h', emoji: '😴', description: 'Giờ giấc bình thường' },
      { value: 'late', label: 'Sau 24h', emoji: '🦉', description: 'Cú đêm chính hiệu' },
      { value: 'flexible', label: 'Tuỳ ngày', emoji: '🔄', description: 'Linh hoạt theo lịch' },
    ],
  },
  {
    id: 'smoking',
    category: 'Cơ bản',
    question: 'Quan điểm của bạn về việc hút thuốc?',
    options: [
      { value: 'never', label: 'Hoàn toàn không', emoji: '🚭', description: 'Không hút và không thích người khác hút' },
      { value: 'sometimes', label: 'Thỉnh thoảng', emoji: '🚬', description: 'Thi thoảng hút xã giao' },
      { value: 'often', label: 'Hay hút', emoji: '💨', description: 'Hút thường xuyên' },
    ],
  },
  {
    id: 'pet',
    category: 'Cơ bản',
    question: 'Bạn có thích nuôi thú cưng không?',
    options: [
      { value: 'love', label: 'Yêu thú cưng', emoji: '🐱', description: 'Muốn nuôi hoặc đã nuôi' },
      { value: 'ok', label: 'OK thôi', emoji: '🐶', description: 'Không nuôi nhưng chấp nhận' },
      { value: 'no', label: 'Không nuôi', emoji: '🙅', description: 'Không thích hoặc dị ứng' },
    ],
  },
  // Step 2: Lifestyle
  {
    id: 'cleanliness',
    category: 'Lối sống',
    question: 'Mức độ ngăn nắp, sạch sẽ của bạn?',
    options: [
      { value: 'very_clean', label: 'Rất sạch sẽ', emoji: '✨', description: 'Luôn dọn dẹp ngay' },
      { value: 'clean', label: 'Ngăn nắp', emoji: '🧹', description: 'Dọn dẹp thường xuyên' },
      { value: 'moderate', label: 'Bình thường', emoji: '🏠', description: 'Dọn khi cần' },
      { value: 'relaxed', label: 'Thoải mái', emoji: '😌', description: 'Không quá khắt khe' },
    ],
  },
  {
    id: 'cooking',
    category: 'Lối sống',
    question: 'Bạn có hay nấu ăn ở nhà không?',
    options: [
      { value: 'often', label: 'Thường xuyên', emoji: '👨‍🍳', description: 'Nấu ăn mỗi ngày' },
      { value: 'sometimes', label: 'Thỉnh thoảng', emoji: '🍳', description: 'Cuối tuần nấu' },
      { value: 'never', label: 'Không bao giờ', emoji: '🥡', description: 'Ăn ngoài / đặt ship' },
    ],
  },
  {
    id: 'guests',
    category: 'Lối sống',
    question: 'Tần suất bạn có khách đến chơi?',
    options: [
      { value: 'never', label: 'Không bao giờ', emoji: '🔒', description: 'Không tiếp khách ở nhà' },
      { value: 'rarely', label: 'Rất ít', emoji: '🚪', description: 'Vài tháng 1 lần' },
      { value: 'sometimes', label: 'Thỉnh thoảng', emoji: '👥', description: 'Tuần 1-2 lần' },
      { value: 'often', label: 'Thường xuyên', emoji: '🎉', description: 'Hay có bạn bè đến' },
    ],
  },
  // Step 3: Personality
  {
    id: 'socialHabit',
    category: 'Tính cách',
    question: 'Bạn là người hướng nội hay hướng ngoại?',
    options: [
      { value: 'introvert', label: 'Hướng nội', emoji: '📚', description: 'Thích không gian riêng' },
      { value: 'ambivert', label: 'Cân bằng', emoji: '⚖️', description: 'Tuỳ thuộc tình huống' },
      { value: 'extrovert', label: 'Hướng ngoại', emoji: '🎭', description: 'Thích giao tiếp' },
    ],
  },
  {
    id: 'noise',
    category: 'Tính cách',
    question: 'Mức độ chịu được tiếng ồn?',
    options: [
      { value: 'quiet', label: 'Thích yên tĩnh', emoji: '🤫', description: 'Cần không gian im lặng' },
      { value: 'moderate', label: 'Bình thường', emoji: '🔊', description: 'Chấp nhận ồn vừa phải' },
      { value: 'loud', label: 'OK với tiếng ồn', emoji: '🎵', description: 'Không ngại tiếng ồn' },
    ],
  },
  {
    id: 'workSchedule',
    category: 'Tính cách',
    question: 'Bạn thường làm việc/học vào thời điểm nào?',
    options: [
      { value: 'morning', label: 'Buổi sáng', emoji: '🌅', description: 'Hiệu quả nhất vào sáng' },
      { value: 'afternoon', label: 'Buổi chiều', emoji: '☀️', description: 'Làm việc tốt nhất chiều' },
      { value: 'evening', label: 'Buổi tối', emoji: '🌙', description: 'Tập trung tốt vào tối' },
      { value: 'flexible', label: 'Linh hoạt', emoji: '🔄', description: 'Làm việc bất kỳ lúc nào' },
    ],
  },
];

const CATEGORIES = ['Cơ bản', 'Lối sống', 'Tính cách'];

export default function Quiz() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizPreferences>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentQuestion = QUIZ_STEPS[currentStep];
  const currentCategory = currentQuestion.category;
  const categoryIndex = CATEGORIES.indexOf(currentCategory);
  const progress = ((currentStep + 1) / QUIZ_STEPS.length) * 100;

  const handleSelect = (value: string) => {
    setSelectedOption(value);
    
    // Auto-advance after selection with animation delay
    setTimeout(() => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
      
      if (currentStep < QUIZ_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedOption(null);
      } else {
        // Quiz complete - navigate to matches
        const finalAnswers = {
          ...answers,
          [currentQuestion.id]: value,
        } as QuizPreferences;
        navigate('/matches', { state: { preferences: finalAnswers } });
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedOption(answers[QUIZ_STEPS[currentStep - 1].id] as string || null);
    }
  };

  return (
    <Layout showNav={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  currentStep === 0
                    ? 'text-muted-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Câu {currentStep + 1}/{QUIZ_STEPS.length}
                </p>
              </div>
              <div className="w-9" />
            </div>
            
            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />
            
            {/* Category Pills */}
            <div className="flex justify-center gap-2 mt-4">
              {CATEGORIES.map((cat, idx) => (
                <div
                  key={cat}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    idx === categoryIndex
                      ? 'bg-primary text-primary-foreground'
                      : idx < categoryIndex
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 container py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center">
                {currentQuestion.question}
              </h2>

              <div className="grid gap-3 max-w-lg mx-auto">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full p-4 rounded-2xl text-left transition-all',
                      'glass-card hover:shadow-elevated',
                      selectedOption === option.value && 'ring-2 ring-primary shadow-glow',
                      answers[currentQuestion.id] === option.value && !selectedOption && 'ring-2 ring-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{option.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{option.label}</p>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                      </div>
                      {(selectedOption === option.value || answers[currentQuestion.id] === option.value) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Hint */}
        <div className="container py-6 text-center">
          <p className="text-sm text-muted-foreground">
            <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
            Chọn câu trả lời phù hợp nhất với bạn
          </p>
        </div>
      </div>
    </Layout>
  );
}



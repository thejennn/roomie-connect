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
  // Phần 1: Giờ giấc & Thói quen ngủ (5 câu)
  {
    id: 'sleepTime',
    category: 'Giờ giấc',
    question: 'Bạn thường đi ngủ và thức dậy vào lúc nào?',
    options: [
      { value: 'early', label: 'Ngủ sớm - Dậy sớm', emoji: '🌅', description: '(Trước 23h - 5-6h sáng)' },
      { value: 'late', label: 'Ngủ muộn - Dậy muộn', emoji: '🦉', description: '(Sau 0h - 8-9h sáng)' },
      { value: 'poor_sleep', label: 'Ngủ muộn - Dậy sớm', emoji: '😩', description: '(Ngủ ít)' },
      { value: 'flexible', label: 'Giờ giấc lung tung', emoji: '🔄', description: '(Tùy hứng)' },
    ],
  },
  {
    id: 'sleepNoise',
    category: 'Giờ giấc',
    question: 'Mức độ nhạy cảm với tiếng ồn khi ngủ?',
    options: [
      { value: 'very_sensitive', label: 'Rất nhạy cảm', emoji: '🤫', description: 'Cần yên tĩnh tuyệt đối' },
      { value: 'somewhat_sensitive', label: 'Hơi nhạy cảm', emoji: '🔇', description: 'Tiếng ồn nhỏ được' },
      { value: 'easy_sleep', label: 'Dễ ngủ', emoji: '😴', description: 'Có ồn cũng ngủ' },
      { value: 'very_deep', label: 'Ngủ như chết', emoji: '💤', description: 'Sấm đánh không tỉnh' },
    ],
  },
  {
    id: 'alarmClock',
    category: 'Giờ giấc',
    question: 'Thói quen để báo thức của bạn?',
    options: [
      { value: 'immediate', label: 'Dậy ngay hồi chuông đầu', emoji: '⏰', description: 'Hay dậy sớm' },
      { value: 'snooze', label: 'Cần 2-3 lần snooze', emoji: '😴', description: 'Để rồi dậy' },
      { value: 'many_alarms', label: 'Đặt nhiều chuông', emoji: '🔔', description: 'Reo ầm ĩ' },
      { value: 'no_alarm', label: 'Không dùng báo thức', emoji: '🌅', description: 'Tự dậy hoặc nhờ người' },
    ],
  },
  {
    id: 'nap',
    category: 'Giờ giấc',
    question: 'Bạn có thói quen ngủ trưa không?',
    options: [
      { value: 'must_nap', label: 'Nhất định phải ngủ', emoji: '🛌', description: 'Tắt đèn, yên tĩnh' },
      { value: 'sometimes_nap', label: 'Chợp mắt tại bàn', emoji: '💼', description: 'Chút ít là được' },
      { value: 'rarely_nap', label: 'Thỉnh thoảng mới ngủ', emoji: '😑', description: 'Hiếm khi' },
      { value: 'never_nap', label: 'Không bao giờ ngủ', emoji: '⚡', description: 'Năng lượng suốt ngày' },
    ],
  },
  {
    id: 'sleepHabits',
    category: 'Giờ giấc',
    question: 'Khi ngủ bạn có thói quen nào?',
    options: [
      { value: 'snore_grind', label: 'Ngáy hoặc nghiến răng', emoji: '😴', description: 'Tiếng ồn khi ngủ' },
      { value: 'talk', label: 'Nói mớ', emoji: '💬', description: 'Tự nói chuyện' },
      { value: 'sprawl', label: 'Gác chân, chiếm diện tích', emoji: '🙃', description: 'Chiếm chỗ' },
      { value: 'clean_sleep', label: 'Ngủ ngoan', emoji: '😇', description: 'Không có tật xấu' },
    ],
  },
  // Phần 2: Vệ sinh & Ngăn nắp (6 câu)
  {
    id: 'roomCleaning',
    category: 'Vệ sinh',
    question: 'Tần suất dọn dẹp phòng của bạn?',
    options: [
      { value: 'daily', label: 'Dọn hàng ngày', emoji: '✨', description: 'Thấy bẩn là dọn ngay' },
      { value: 'weekly', label: 'Dọn 1-2 lần/tuần', emoji: '🧹', description: 'Thường là cuối tuần' },
      { value: 'when_messy', label: 'Khi quá bừa bộn', emoji: '🏠', description: 'Dọn theo nhu cầu' },
      { value: 'rarely', label: 'Rất ít khi dọn', emoji: '😅', description: 'Chỉ dọn chỗ nằm' },
    ],
  },
  {
    id: 'dishWashing',
    category: 'Vệ sinh',
    question: 'Quan điểm về việc rửa bát sau khi ăn?',
    options: [
      { value: 'immediately', label: 'Rửa ngay lập tức', emoji: '🍽️', description: 'Xong ăn là rửa' },
      { value: 'end_of_day', label: 'Rửa cuối ngày', emoji: '⏰', description: 'Dồn đến lúc rửa chung' },
      { value: 'delayed', label: 'Ngâm đó rửa sau', emoji: '💧', description: 'Khi nào cần lại rửa' },
      { value: 'eat_out', label: 'Ăn ngoài thường xuyên', emoji: '🍜', description: 'Ít nấu nướng' },
    ],
  },
  {
    id: 'trash',
    category: 'Vệ sinh',
    question: 'Bạn xử lý rác như thế nào?',
    options: [
      { value: 'daily', label: 'Đổ rác hàng ngày', emoji: '🗑️', description: 'Không để qua đêm' },
      { value: 'full', label: 'Đợi đầy thùng rồi đổ', emoji: '🫙', description: 'Khi đầy mới đi' },
      { value: 'smell', label: 'Đợi bốc mùi mới đổ', emoji: '🤢', description: 'Khá lâu' },
      { value: 'anywhere', label: 'Tiện đâu vứt đó', emoji: '😬', description: 'Khá bừa bộn' },
    ],
  },
  {
    id: 'organization',
    category: 'Vệ sinh',
    question: 'Mức độ ngăn nắp đồ đạc cá nhân?',
    options: [
      { value: 'very_organized', label: 'Luôn ở đúng vị trí', emoji: '📦', description: 'Gọn gàng tuyệt đối' },
      { value: 'mostly_organized', label: 'Tương đối gọn gàng', emoji: '🧳', description: 'Thỉnh thoảng hơi lộn' },
      { value: 'organized_chaos', label: 'Bừa có trật tự', emoji: '🎯', description: 'Mình tôi tìm được' },
      { value: 'very_messy', label: 'Quần áo chất đống', emoji: '🌪️', description: 'Lung tung khắp phòng' },
    ],
  },
  {
    id: 'sharedBathroom',
    category: 'Vệ sinh',
    question: 'Việc dọn nhà vệ sinh chung?',
    options: [
      { value: 'schedule', label: 'Theo lịch phân công', emoji: '📅', description: 'Cọ rửa hàng tuần' },
      { value: 'self_initiative', label: 'Tự giác khi bẩn', emoji: '🧼', description: 'Ai thấy bẩn tự cọ' },
      { value: 'paid_cleaning', label: 'Thuê người dọn', emoji: '👷', description: 'Định kỳ' },
      { value: 'reluctant', label: 'Cực kỳ ngại dọn', emoji: '😫', description: 'Tránh tính toán' },
    ],
  },
  {
    id: 'pets',
    category: 'Vệ sinh',
    question: 'Bạn có nuôi thú cưng không?',
    options: [
      { value: 'have_pet', label: 'Có thú cưng (mang theo)', emoji: '🐱', description: 'Chó/Mèo/Khác' },
      { value: 'like_pet', label: 'Không nuôi nhưng thích', emoji: '🐕', description: 'Chơi cùng được' },
      { value: 'allergic', label: 'Bị dị ứng/không thích', emoji: '🚫', description: 'Không thích lông' },
      { value: 'indifferent', label: 'Không quan tâm', emoji: '😐', description: 'Bất kể' },
    ],
  },
  // Phần 3: Khách khứa & Riêng tư (5 câu)
  {
    id: 'guests',
    category: 'Khách khứa',
    question: 'Bạn có hay dẫn bạn bè/người yêu về?',
    options: [
      { value: 'often', label: 'Thường xuyên', emoji: '👥', description: 'Phòng là nơi tụ tập' },
      { value: 'sometimes', label: 'Thỉnh thoảng', emoji: '🚪', description: '1-2 lần/tuần' },
      { value: 'rarely', label: 'Hiếm khi', emoji: '🚶', description: 'Chỉ dịp đặc biệt' },
      { value: 'never', label: 'Tuyệt đối không', emoji: '🔒', description: 'Cần riêng tư' },
    ],
  },
  {
    id: 'oppositeGender',
    category: 'Khách khứa',
    question: 'Bạn có thoải mái nếu bạn cùng phòng dẫn người khác giới về ngủ lại?',
    options: [
      { value: 'comfortable', label: 'Thoải mái hoàn toàn', emoji: '✅', description: 'Không vấn đề' },
      { value: 'with_notice', label: 'Được nhưng phải báo', emoji: '📢', description: 'Thông báo trước' },
      { value: 'visit_only', label: 'Chỉ được chơi', emoji: '👋', description: 'Không được ngủ' },
      { value: 'not_allowed', label: 'Tuyệt đối không', emoji: '❌', description: 'Không chấp nhận' },
    ],
  },
  {
    id: 'studyTime',
    category: 'Khách khứa',
    question: 'Bạn cần yên tĩnh để học/làm việc vào lúc nào?',
    options: [
      { value: 'morning', label: 'Buổi sáng', emoji: '🌅', description: 'Học tốt sáng' },
      { value: 'afternoon', label: 'Buổi chiều', emoji: '☀️', description: 'Tập trung chiều' },
      { value: 'evening_night', label: 'Buổi tối/Đêm', emoji: '🌙', description: 'Tối mới học' },
      { value: 'anytime_or_cafe', label: 'Luôn cần hoặc ra ngoài', emoji: '📚', description: 'Học quán cafe' },
    ],
  },
  {
    id: 'dressing',
    category: 'Khách khứa',
    question: 'Bạn ở trong phòng thường mặc thế nào?',
    options: [
      { value: 'formal', label: 'Chỉn chu, lịch sự', emoji: '👔', description: 'Kể cả ở nhà' },
      { value: 'casual', label: 'Quần áo thoải mái', emoji: '👖', description: 'Đồ ngủ' },
      { value: 'minimal', label: 'Mát mẻ nhất', emoji: '🩱', description: 'Quần đùi/cởi trần' },
      { value: 'mood', label: 'Tùy hứng', emoji: '🎲', description: 'Bất kỳ' },
    ],
  },
  {
    id: 'speaker',
    category: 'Khách khứa',
    question: 'Bạn có hay nghe nhạc/xem phim bằng loa ngoài?',
    options: [
      { value: 'often', label: 'Thường xuyên', emoji: '🔊', description: 'Dùng loa ngoài' },
      { value: 'sometimes', label: 'Thỉnh thoảng', emoji: '🔉', description: 'Âm lượng nhỏ' },
      { value: 'headphones', label: 'Luôn dùng tai nghe', emoji: '🎧', description: 'Không làm phiền' },
      { value: 'no_media', label: 'Không nghe nhạc', emoji: '🤐', description: 'Hiếm khi' },
    ],
  },
  // Phần 4: Tài chính & Sử dụng đồ chung (4 câu)
  {
    id: 'utilities',
    category: 'Tài chính',
    question: 'Bạn muốn chia tiền điện/nước/mạng như thế nào?',
    options: [
      { value: 'equal', label: 'Chia đều theo đầu người', emoji: '⚖️', description: 'Bất kể dùng ít nhiều' },
      { value: 'by_usage', label: 'Dùng nhiều đóng nhiều', emoji: '📊', description: 'Ai dùng PC nhiều đóng hơn' },
      { value: 'separate_meter', label: 'Công tơ riêng', emoji: '⚡', description: 'Nếu có thể' },
      { value: 'all_in_rent', label: 'Gộp vào tiền phòng', emoji: '💰', description: 'Giá phòng cao hơn' },
    ],
  },
  {
    id: 'sharedItems',
    category: 'Tài chính',
    question: 'Quan điểm về sử dụng đồ đạc của nhau?',
    options: [
      { value: 'share_all', label: 'Dùng chung + chia tiền', emoji: '🤝', description: 'Tiết kiệm chung' },
      { value: 'strictly_separate', label: 'Tuyệt đối riêng', emoji: '🚫', description: 'Không đụng chạm' },
      { value: 'ask_first', label: 'Có thể mượn nếu hỏi', emoji: '❓', description: 'Xin phép trước' },
      { value: 'share_some', label: 'Dùng chung lặt vặt', emoji: '🛢️', description: 'Dầu gội, nước rửa' },
    ],
  },
  {
    id: 'rentPayment',
    category: 'Tài chính',
    question: 'Bạn thường thanh toán tiền phòng khi nào?',
    options: [
      { value: 'on_time', label: 'Đúng hạn hoặc sớm', emoji: '✅', description: 'Luôn đúng hẹn' },
      { value: 'slightly_late', label: 'Đôi khi trễ 1-2 ngày', emoji: '⏳', description: 'Nhưng báo trước' },
      { value: 'forgetful', label: 'Hay quên', emoji: '😅', description: 'Cần người nhắc' },
      { value: 'often_late', label: 'Thường kẹt tiền', emoji: '😩', description: 'Hay xin khất' },
    ],
  },
  {
    id: 'cooking_habit',
    category: 'Tài chính',
    question: 'Thói quen nấu ăn của bạn?',
    options: [
      { value: 'cook_daily', label: 'Nấu ăn hàng ngày', emoji: '👨‍🍳', description: 'Tại phòng' },
      { value: 'cook_simple', label: 'Nấu mì tôm đơn giản', emoji: '🍜', description: 'Chỉ đơn giản' },
      { value: 'eat_out', label: 'Ăn ngoài/mua sẵn', emoji: '🍽️', description: 'Ít nấu ở nhà' },
      { value: 'cook_together', label: 'Nấu chung với phòng', emoji: '🥘', description: 'Góp tiền chung' },
    ],
  },
  // Phần 5: Tính cách & Lối sống (5 câu)
  {
    id: 'socialHabit',
    category: 'Tính cách',
    question: 'Bạn tự nhận xét mình là người hướng nào?',
    options: [
      { value: 'extrovert', label: 'Hướng ngoại', emoji: '🎭', description: 'Thích giao tiếp, sôi nổi' },
      { value: 'introvert', label: 'Hướng nội', emoji: '📚', description: 'Thích yên tĩnh, ít nói' },
      { value: 'ambivert', label: 'Cân bằng', emoji: '⚖️', description: 'Tùy lúc và tùy người' },
      { value: 'reserved', label: 'Khó tính, ít giao du', emoji: '🤐', description: 'Riêng tư' },
    ],
  },
  {
    id: 'smoking',
    category: 'Tính cách',
    question: 'Bạn có hút thuốc lá/thuốc lào/vape không?',
    options: [
      { value: 'smoke_indoors', label: 'Có, hút trong phòng', emoji: '🚬', description: 'Hút thường xuyên' },
      { value: 'smoke_outdoors', label: 'Có, hút ngoài', emoji: '🌬️', description: 'Ra ban công/ngoài' },
      { value: 'no_smoke_ok', label: 'Không nhưng chấp nhận', emoji: '😐', description: 'Mùi không sao' },
      { value: 'hate_smoke', label: 'Ghét mùi thuốc', emoji: '🚭', description: 'Cực kỳ ghét' },
    ],
  },
  {
    id: 'ac_fan',
    category: 'Tính cách',
    question: 'Thói quen sử dụng điều hòa/quạt?',
    options: [
      { value: 'ac_always_cold', label: 'AC cả ngày, rất lạnh', emoji: '❄️', description: 'Dưới 24 độ' },
      { value: 'ac_moderate', label: 'AC khi nóng, vừa phải', emoji: '🌡️', description: '26-27 độ' },
      { value: 'ac_timer', label: 'Hẹn giờ tắt', emoji: '⏰', description: 'Tắt lúc nửa đêm' },
      { value: 'fan_only', label: 'Ít dùng, chủ quạt', emoji: '🌀', description: 'Thích quạt hơn' },
    ],
  },
  {
    id: 'conflict_style',
    category: 'Tính cách',
    question: 'Cách bạn giải quyết mâu thuẫn?',
    options: [
      { value: 'direct', label: 'Nói thẳng trực tiếp', emoji: '💬', description: 'Giải quyết ngay lúc' },
      { value: 'message', label: 'Nhắn tin/viết giấy', emoji: '📝', description: 'Góp ý nhẹ nhàng' },
      { value: 'silent', label: 'Im lặng chịu đựng', emoji: '🤐', description: 'Giữ trong lòng' },
      { value: 'tell_others', label: 'Kể lể/tỏ thái độ', emoji: '😠', description: 'Khó chịu ra mặt' },
    ],
  },
  {
    id: 'alcohol',
    category: 'Tính cách',
    question: 'Sở thích uống rượu bia/nhậu tại phòng?',
    options: [
      { value: 'often_drink', label: 'Thường tổ chức nhậu', emoji: '🍺', description: 'Tại phòng thường xuyên' },
      { value: 'sometimes_drink', label: 'Thỉnh thoảng vui vẻ', emoji: '🍻', description: 'Có chút là được' },
      { value: 'never_drink_home', label: 'Không nhậu ở nhà', emoji: '🚫', description: 'Không bao giờ' },
      { value: 'cant_drink', label: 'Không uống được', emoji: '🍷', description: 'Dị ứng/sức khỏe' },
    ],
  },
  // Phần 6: Câu hỏi mở rộng (5 câu)
  {
    id: 'priority',
    category: 'Ưu tiên',
    question: 'Bạn ưu tiên tiêu chí nào nhất khi tìm bạn ở?',
    options: [
      { value: 'cleanliness', label: 'Sạch sẽ, ngăn nắp', emoji: '✨', description: 'Vệ sinh là hàng đầu' },
      { value: 'financial', label: 'Sòng phẳng tiền nong', emoji: '💰', description: 'Rõ ràng chi phí' },
      { value: 'personality', label: 'Hợp tính cách', emoji: '🤝', description: 'Dễ nói chuyện' },
      { value: 'privacy', label: 'Yên tĩnh, riêng tư', emoji: '🔒', description: 'Tôn trọng không gian' },
    ],
  },
  {
    id: 'gender_preference',
    category: 'Ưu tiên',
    question: 'Giới tính bạn cùng phòng mong muốn?',
    options: [
      { value: 'male', label: 'Nam giới', emoji: '👨', description: 'Preferably male' },
      { value: 'female', label: 'Nữ giới', emoji: '👩', description: 'Preferably female' },
      { value: 'lgbtq', label: 'Cộng đồng LGBT', emoji: '🏳️‍🌈', description: 'Open minded' },
      { value: 'no_preference', label: 'Không quan trọng', emoji: '😊', description: 'Bất kỳ giới tính' },
    ],
  },
  {
    id: 'budget',
    category: 'Ưu tiên',
    question: 'Mức chi trả tiền phòng tối đa hàng tháng?',
    options: [
      { value: 'under_1.5m', label: 'Dưới 1.5 triệu', emoji: '💵', description: 'Tiết kiệm' },
      { value: '1.5_2.5m', label: '1.5 - 2.5 triệu', emoji: '💴', description: 'Vừa phải' },
      { value: '2.5_4m', label: '2.5 - 4 triệu', emoji: '💶', description: 'Thoải mái' },
      { value: 'over_4m', label: 'Trên 4 triệu', emoji: '💷', description: 'Cao cấp' },
    ],
  },
  {
    id: 'location',
    category: 'Ưu tiên',
    question: 'Khu vực bạn muốn ở?',
    options: [
      { value: 'near_school', label: 'Gần trường/chỗ làm', emoji: '🎓', description: 'Bán kính < 2km' },
      { value: 'flexible_location', label: 'Xa chút cũng được', emoji: '🚗', description: 'Miễn là phòng tốt' },
      { value: 'downtown', label: 'Khu vực trung tâm', emoji: '🏙️', description: 'Sầm uất' },
      { value: 'quiet_area', label: 'Khu vực yên tĩnh', emoji: '🌳', description: 'An ninh tốt' },
    ],
  },
  {
    id: 'duration',
    category: 'Ưu tiên',
    question: 'Bạn dự định ở ghép bao lâu?',
    options: [
      { value: 'short_term', label: 'Ngắn hạn', emoji: '📅', description: 'Dưới 3 tháng' },
      { value: 'medium_term', label: 'Trung hạn', emoji: '📆', description: '3 - 6 tháng' },
      { value: 'long_term', label: 'Dài hạn', emoji: '📊', description: '6 tháng - 1 năm' },
      { value: 'very_long_term', label: 'Lâu dài', emoji: '🏠', description: 'Trên 1 năm' },
    ],
  },
];

const CATEGORIES = ['Giờ giấc', 'Vệ sinh', 'Khách khứa', 'Tài chính', 'Tính cách', 'Ưu tiên'];

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
      setSelectedOption(null);
    } else {
      // Quay về trang chọn loại
      navigate('/find-roommate');
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
                type="button"
                className={cn(
                  'p-2 rounded-full transition-colors cursor-pointer text-foreground hover:bg-muted'
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



import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiClient } from '@/lib/api';

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const resetSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  otp: z.string().min(6, 'Mã OTP phải có ít nhất 6 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [otpSent, setOtpSent] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    if (otpCountdown <= 0) {
      setCanResendOtp(true);
      return;
    }
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSendingOtp(true);
    const { error } = await apiClient.sendOtp(email);
    setIsSendingOtp(false);

    if (error) {
      toast.error('Lỗi: ' + error);
    } else {
      toast.success('Mã OTP đã được gửi đến email của bạn!');
      setOtpSent(true);
      setOtpCountdown(60);
      setCanResendOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetSchema.safeParse({ email, otp, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await apiClient.resetPassword(email, otp, password);
    setIsLoading(false);

    if (error) {
      if (error.includes('OTP')) {
        toast.error('Mã OTP không đúng hoặc đã hết hạn');
      } else {
        toast.error('Lỗi: ' + error);
      }
    } else {
      toast.success('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh opacity-60" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <Link 
          to="/auth/login" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>

        <div className="glass-card rounded-3xl p-8 shadow-elevated">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Quên Mật Khẩu</h1>
            <p className="text-muted-foreground text-sm">
              Nhập thông tin để đặt lại mật khẩu của bạn
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* Email with Send OTP Button */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Đã đăng kí</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Ví dụ: a@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent || isSendingOtp}
                  className={errors.email ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!canResendOtp || isSendingOtp || !email}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isSendingOtp ? 'Đang...' : otpCountdown > 0 ? `${otpCountdown}s` : 'Gửi Mã OTP'}
                </Button>
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* OTP Field */}
            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Mã OTP 6 ký tự"
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                disabled={isLoading}
                maxLength={6}
                className={errors.otp ? 'border-destructive' : ''}
              />
              {errors.otp && (
                <p className="text-sm text-destructive">{errors.otp}</p>
              )}
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mật khẩu mới
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác minh mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !otpSent}
              className="w-full mt-6"
              size="lg"
            >
              {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-muted-foreground">
              Nhớ mật khẩu? {' '}
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

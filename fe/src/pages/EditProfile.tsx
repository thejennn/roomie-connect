import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Camera, User } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema for tenant
const tenantProfileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  university: z.string().optional(),
  workplace: z.string().optional(),
});

// Validation schema for landlord
const landlordProfileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  bankName: z.string().min(1, 'Vui lòng nhập tên ngân hàng').optional(),
  bankAccount: z.string().min(1, 'Vui lòng nhập số tài khoản').optional(),
});

type TenantFormData = z.infer<typeof tenantProfileSchema>;
type LandlordFormData = z.infer<typeof landlordProfileSchema>;

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, role, isAuthenticated, loading: authLoading, refreshUser } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Vui lòng đăng nhập để chỉnh sửa hồ sơ');
      navigate('/auth/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load user data on mount
  useEffect(() => {
    if (user && !authLoading) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      if (role === 'tenant') {
        setUniversity(user.university || '');
        setWorkplace(user.workplace || '');
      } else if (role === 'landlord') {
        setBankName(user.bankName || '');
        setBankAccount(user.bankAccount || '');
      }
    }
  }, [user, role, authLoading]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    if (!file.type.match(/^image\//)) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarUrl(dataUrl);
        toast.success('Tải ảnh lên thành công');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
      setUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let validationResult;

    if (role === 'tenant') {
      validationResult = tenantProfileSchema.safeParse({
        fullName,
        phone,
        university: university || undefined,
        workplace: workplace || undefined,
      } as TenantFormData);
    } else {
      validationResult = landlordProfileSchema.safeParse({
        fullName,
        phone,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
      } as LandlordFormData);
    }

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await handleSave(validationResult.data);
  };

  const handleSave = async (data: TenantFormData | LandlordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await apiClient.updateProfile({ ...data, avatarUrl });

      if (error) {
        toast.error('Lỗi: ' + error);
        return;
      }

      // Refresh user data from backend
      await refreshUser();

      toast.success('Hồ sơ đã được cập nhật thành công!');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Không thể cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Chỉnh Sửa Hồ Sơ</h1>
            <p className="text-muted-foreground">
              {role === 'tenant' ? 'Cập nhật thông tin cá nhân' : 'Cập nhật thông tin tài khoản'}
            </p>
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-3xl">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            <p className="text-xs text-muted-foreground">Nhấn vào biểu tượng máy ảnh để thay đổi ảnh (tối đa 2MB)</p>
          </div>

          {/* Form */}
          <form onSubmit={validateAndSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và Tên *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Số Điện Thoại *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Nhập số điện thoại 10 chữ số"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className={errors.phone ? 'border-destructive' : ''}
                disabled={isLoading}
                maxLength={10}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Tenant Fields */}
            {role === 'tenant' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="university">Trường Đại Học</Label>
                  <Input
                    id="university"
                    type="text"
                    placeholder="Nhập tên trường"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workplace">Nơi Làm Việc</Label>
                  <Input
                    id="workplace"
                    type="text"
                    placeholder="Nhập nơi làm việc"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* Landlord Fields */}
            {role === 'landlord' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Ngân Hàng</Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="Nhập tên ngân hàng"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.bankName && (
                    <p className="text-sm text-destructive">{errors.bankName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Số Tài Khoản Ngân Hàng</Label>
                  <Input
                    id="bankAccount"
                    type="text"
                    placeholder="Nhập số tài khoản"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.bankAccount && (
                    <p className="text-sm text-destructive">{errors.bankAccount}</p>
                  )}
                </div>
              </>
            )}

            {/* Note */}
            <div className="p-4 bg-muted/50 rounded-2xl">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Lưu ý:</span> Email của bạn không thể thay đổi. 
                Liên hệ với bộ phận hỗ trợ nếu cần thay đổi email.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-full h-11 font-semibold gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
                disabled={isLoading}
                className="flex-1 rounded-full h-11"
              >
                Hủy
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}

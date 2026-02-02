import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LandlordLayout from '@/components/layouts/LandlordLayout';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const topUpAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export default function LandlordWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user?.id, balance: 0 })
          .select()
          .single();

        if (!createError && newWallet) {
          setBalance(newWallet.balance);
        }
      } else if (walletData) {
        setBalance(walletData.balance);
      }

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!txError && txData) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (topUpAmount < 10000) {
      toast.error('Số tiền tối thiểu là 10,000đ');
      return;
    }

    setShowSuccess(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: balance + topUpAmount })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: topUpAmount,
          type: 'topup',
          description: 'Nạp tiền qua VietQR'
        });

      if (txError) throw txError;

      setBalance(prev => prev + topUpAmount);
      setShowSuccess(false);
      setShowTopUp(false);
      setTopUpAmount(0);
      toast.success(`Nạp thành công ${formatCurrency(topUpAmount)}`);
      fetchWalletData();
    } catch (error) {
      console.error('Error topping up:', error);
      toast.error('Có lỗi xảy ra khi nạp tiền');
      setShowSuccess(false);
    }
  };

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Ví tiền</h1>
          <p className="text-muted-foreground mt-1">Quản lý số dư và giao dịch của bạn</p>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-accent text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
            <CardContent className="relative p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="h-6 w-6" />
                </div>
                <span className="text-lg font-medium text-white/80">Số dư hiện tại</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-8">
                {formatCurrency(balance)}
              </div>
              <Button 
                onClick={() => setShowTopUp(true)}
                className="bg-white text-primary hover:bg-white/90 rounded-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nạp tiền
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pricing Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Gói Tin Lẻ</div>
                  <div className="text-sm text-muted-foreground">Thanh toán theo tin</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-primary mb-2">50.000đ / tin</div>
              <p className="text-sm text-muted-foreground">Hiển thị 30 ngày, đăng nhanh, dễ dàng</p>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardContent className="p-6 relative">
              <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                Tiết kiệm 50%
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold">Gói Tháng</div>
                  <div className="text-sm text-muted-foreground">Không giới hạn tin</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-accent mb-2">500.000đ / tháng</div>
              <p className="text-sm text-muted-foreground">Đăng không giới hạn, ưu tiên hiển thị</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{tx.description || 'Giao dịch'}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-up Modal */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nạp tiền vào ví</DialogTitle>
          </DialogHeader>
          
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-4"
                >
                  <CheckCircle2 className="h-10 w-10" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Đang xử lý...</h3>
                <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Tabs defaultValue="qr" className="mt-4">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="qr">
                      <QrCode className="h-4 w-4 mr-2" />
                      VietQR
                    </TabsTrigger>
                    <TabsTrigger value="transfer">
                      <Building2 className="h-4 w-4 mr-2" />
                      Chuyển khoản
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="qr" className="mt-4 space-y-4">
                    <div>
                      <Label>Số tiền nạp</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {topUpAmounts.map((amount) => (
                          <Button
                            key={amount}
                            variant={topUpAmount === amount ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTopUpAmount(amount)}
                          >
                            {formatCurrency(amount).replace(' ₫', '')}
                          </Button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        placeholder="Hoặc nhập số khác"
                        className="mt-2"
                        value={topUpAmount || ''}
                        onChange={(e) => setTopUpAmount(Number(e.target.value))}
                      />
                    </div>

                    {topUpAmount > 0 && (
                      <div className="p-4 bg-muted rounded-xl text-center">
                        <div className="w-40 h-40 mx-auto bg-white rounded-lg flex items-center justify-center mb-3">
                          <QrCode className="h-32 w-32 text-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quét mã QR để thanh toán <span className="font-semibold text-foreground">{formatCurrency(topUpAmount)}</span>
                        </p>
                      </div>
                    )}

                    <Button 
                      className="w-full rounded-full" 
                      onClick={handleTopUp}
                      disabled={topUpAmount < 10000}
                    >
                      Xác nhận đã thanh toán
                    </Button>
                  </TabsContent>

                  <TabsContent value="transfer" className="mt-4 space-y-4">
                    <div className="p-4 bg-muted rounded-xl space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ngân hàng</span>
                        <span className="font-medium">Vietcombank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số tài khoản</span>
                        <span className="font-medium font-mono">1234567890</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chủ tài khoản</span>
                        <span className="font-medium">NOC NOC JSC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nội dung</span>
                        <span className="font-medium font-mono">NAPVI USER123</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Sau khi chuyển khoản, số dư sẽ được cập nhật trong 1-5 phút
                    </p>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </LandlordLayout>
  );
}



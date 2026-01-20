import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Home,
  TrendingUp,
  Check,
  X,
  Eye,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/layouts/AdminLayout';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const stats = [
  { label: 'Tổng doanh thu', value: 125000000, icon: DollarSign, color: 'from-emerald-500 to-teal-500', format: 'currency' },
  { label: 'Tổng người dùng', value: 1250, icon: Users, color: 'from-primary to-accent', format: 'number' },
  { label: 'Phòng hoạt động', value: 450, icon: Home, color: 'from-amber-500 to-orange-500', format: 'number' },
  { label: 'Phòng chờ duyệt', value: 23, icon: TrendingUp, color: 'from-rose-500 to-pink-500', format: 'number' },
];

const pendingRooms = [
  { id: '1', title: 'Studio khép kín full nội thất', owner: 'Cô Lan', price: 3500000, district: 'Thạch Hòa', createdAt: '2025-01-15' },
  { id: '2', title: 'Phòng ghép 2 người gần ĐHQG', owner: 'Chú Hùng', price: 2000000, district: 'Tân Xã', createdAt: '2025-01-14' },
  { id: '3', title: 'Căn hộ mini view đẹp', owner: 'Em Trang', price: 4000000, district: 'Thạch Hòa', createdAt: '2025-01-14' },
];

const users = [
  { id: '1', name: 'Nguyễn Văn A', email: 'a@example.com', role: 'tenant', createdAt: '2025-01-10', status: 'active' },
  { id: '2', name: 'Trần Thị B', email: 'b@example.com', role: 'landlord', createdAt: '2025-01-09', status: 'active' },
  { id: '3', name: 'Lê Văn C', email: 'c@example.com', role: 'tenant', createdAt: '2025-01-08', status: 'banned' },
  { id: '4', name: 'Phạm Thị D', email: 'd@example.com', role: 'landlord', createdAt: '2025-01-07', status: 'active' },
];

const transactions = [
  { id: '1', user: 'Cô Lan', type: 'topup', amount: 1000000, createdAt: '2025-01-15 10:30' },
  { id: '2', user: 'Chú Hùng', type: 'post_fee', amount: 50000, createdAt: '2025-01-15 09:15' },
  { id: '3', user: 'Em Trang', type: 'topup', amount: 2000000, createdAt: '2025-01-14 16:45' },
  { id: '4', user: 'Bác Minh', type: 'subscription', amount: 500000, createdAt: '2025-01-14 14:20' },
];

export default function AdminDashboard() {
  const handleApprove = (id: string) => {
    toast.success('Đã duyệt tin đăng #' + id);
  };

  const handleReject = (id: string) => {
    toast.error('Đã từ chối tin đăng #' + id);
  };

  const handleBan = (id: string) => {
    toast.warning('Đã cấm người dùng #' + id);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hệ thống Nốc Nốc</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.format === 'currency' 
                      ? formatCurrency(stat.value)
                      : stat.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rooms" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rooms">Phòng chờ duyệt</TabsTrigger>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Tin đăng chờ duyệt ({pendingRooms.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Chủ trọ</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Khu vực</TableHead>
                      <TableHead>Ngày đăng</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.title}</TableCell>
                        <TableCell>{room.owner}</TableCell>
                        <TableCell>{formatCurrency(room.price)}</TableCell>
                        <TableCell>{room.district}</TableCell>
                        <TableCell>{room.createdAt}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => toast.info('Xem chi tiết')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(room.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(room.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý người dùng</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'landlord' ? 'default' : 'secondary'}>
                            {user.role === 'landlord' ? 'Chủ trọ' : 'Người thuê'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.createdAt}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                            {user.status === 'active' ? 'Hoạt động' : 'Đã cấm'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={user.status === 'active' ? 'destructive' : 'default'}
                            onClick={() => handleBan(user.id)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            {user.status === 'active' ? 'Cấm' : 'Bỏ cấm'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử giao dịch</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.user}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'topup' ? 'default' : 'secondary'}>
                            {tx.type === 'topup' ? 'Nạp tiền' : 
                             tx.type === 'post_fee' ? 'Phí đăng tin' : 'Gói tháng'}
                          </Badge>
                        </TableCell>
                        <TableCell className={tx.type === 'topup' ? 'text-emerald-600' : ''}>
                          {tx.type === 'topup' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>{tx.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}



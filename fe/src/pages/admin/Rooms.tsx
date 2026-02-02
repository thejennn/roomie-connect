import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { mockPendingRooms, MockRoom } from '@/lib/adminMockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminRooms() {
  const [rooms, setRooms] = useState<MockRoom[]>(mockPendingRooms);
  const [activeTab, setActiveTab] = useState<'pending'|'active'|'hidden'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null);

  const changeStatus = (id: string, status: MockRoom['status']) => {
    setRooms(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    // mock notification - in real app call API
    console.log(`Notify: room ${id} status -> ${status}`);
  };

  const handleReject = (id: string) => {
    setCurrentRejectId(id);
    const reason = prompt('Lý do từ chối (nhập)') || '';
    if (reason) {
      // apply rejection
      changeStatus(id, 'rejected');
      console.log(`Rejected ${id}: ${reason}`);
    }
    setCurrentRejectId(null);
  };

  const filtered = rooms.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'active') return r.status === 'active';
    if (activeTab === 'hidden') return r.status === 'hidden' || r.status === 'rejected';
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quản lý Tin đăng</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setActiveTab('pending')}>Chờ duyệt</Button>
            <Button variant="ghost" onClick={() => setActiveTab('active')}>Đang hiển thị</Button>
            <Button variant="ghost" onClick={() => setActiveTab('hidden')}>Đã ẩn</Button>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm overflow-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Ảnh</th>
                <th className="px-4 py-3 text-left text-sm">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm">Chủ trọ</th>
                <th className="px-4 py-3 text-left text-sm">Giá</th>
                <th className="px-4 py-3 text-left text-sm">Ngày đăng</th>
                <th className="px-4 py-3 text-left text-sm">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3"><div className="h-12 w-20 bg-slate-100 rounded" /></td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.title}</td>
                  <td className="px-4 py-3">{r.landlord}</td>
                  <td className="px-4 py-3">{r.price.toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">{r.postedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {r.status !== 'active' && <Button size="sm" onClick={() => changeStatus(r.id, 'active')}>Duyệt</Button>}
                    {r.status !== 'rejected' && <Button variant="ghost" size="sm" onClick={() => handleReject(r.id)}>Từ chối</Button>}
                    <Button variant="destructive" size="sm" onClick={() => setRooms(rs => rs.filter(x => x.id !== r.id))}>Xóa</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Không có tin</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
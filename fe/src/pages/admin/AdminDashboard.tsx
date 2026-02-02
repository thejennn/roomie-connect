// src/pages/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { MOCK_ROOMS } from '@/lib/mockData';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [rooms, setRooms] = useState(MOCK_ROOMS.map(r => ({ ...r, status: (r as any).status || 'pending' })));
  const totalRevenue = 50000 * rooms.filter(r => r.status === 'active').length;
  const totalUsers = 1200; // mock

  const toggleApproval = (id: string, approve: boolean) => {
    setRooms(rs => rs.map(r => r.id === id ? { ...r, status: approve ? 'active' : 'rejected' } : r));
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Quản lý tin đăng</h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Doanh thu (ước tính)</div>
          <div className="text-xl font-bold">{(totalRevenue).toLocaleString()} VND</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-muted-foreground">Tổng người dùng</div>
          <div className="text-xl font-bold">{totalUsers}</div>
        </div>
      </div>

      <div className="space-y-3">
        {rooms.map(r => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-muted-foreground">{r.address} • {(r.price/1000000).toFixed(1)}tr</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => toggleApproval(r.id, true)} disabled={r.status === 'active'}>Approve</Button>
              <Button variant="destructive" onClick={() => toggleApproval(r.id, false)} disabled={r.status === 'rejected'}>Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



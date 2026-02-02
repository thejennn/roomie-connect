import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { mockUsers, MockUser } from '@/lib/adminMockData';
import { Button } from '@/components/ui/button';

export default function AdminUsers() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [filter, setFilter] = useState<'all'|'landlord'|'tenant'>('all');

  const toggleBan = (id: string) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, status: x.status === 'active' ? 'banned' : 'active' } : x));
  };

  const filtered = users.filter(u => filter === 'all' ? true : u.role === filter);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quản lý Người dùng</h2>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-1 rounded border">
              <option value="all">All</option>
              <option value="landlord">Landlord</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm overflow-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Người dùng</th>
                <th className="px-4 py-3 text-left text-sm">Liên hệ</th>
                <th className="px-4 py-3 text-left text-sm">Role</th>
                <th className="px-4 py-3 text-left text-sm">Ví</th>
                <th className="px-4 py-3 text-left text-sm">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">{u.name.split(' ').slice(-1)[0][0]}</div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'landlord' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">{u.wallet ? u.wallet.toLocaleString('vi-VN') + '₫' : '-'}</td>
                  <td className="px-4 py-3">{u.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant={u.status === 'active' ? 'destructive' : 'secondary'} size="sm" onClick={() => toggleBan(u.id)}>
                      {u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Không có người dùng</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
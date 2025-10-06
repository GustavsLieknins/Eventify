import React from 'react';
import TopNav from '@/Shared/TopNav';

export default function AdminDashboard() {
  return (
    <>
      <TopNav active="admin" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-gray-600 mt-2">Welcome to the admin dashboard.</p>
      </div>
    </>
  );
}

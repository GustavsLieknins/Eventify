import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import TopNav from '@/Shared/TopNav';
import './SuperAdmin.css';

export default function SuperAdminIndex() {
  const { users = [], flash = {}, superCount = 0, meId = null } = usePage().props;
  const [busy, setBusy] = useState(false);

  const post = (url) => { setBusy(true); router.post(url, {}, { onFinish: () => setBusy(false) }); };
  const makeAdmin = (id) => post(`/superadmin/${id}/promote`);
  const removeAdmin = (id) => post(`/superadmin/${id}/demote`);
  const makeSuper = (id) => post(`/superadmin/${id}/make-super`);
  const removeSuper = (id) => post(`/superadmin/${id}/remove-super`);
  const isMe = (u) => meId && u.id === meId;
  const isLastSuper = (u) => u.role === 2 && superCount <= 1;

  return (
    <>
      <TopNav active="superadmin" />
      <div className="sa-wrap">
        <div className="sa-container">
          <div className="sa-card">
            <div className="sa-title">SuperAdmin Dashboard</div>

            {flash?.success && <div className="sa-flash sa-flash--ok">{flash.success}</div>}
            {flash?.error && <div className="sa-flash sa-flash--err">{flash.error}</div>}

            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th style={{ textAlign:'center' }}>Role</th>
                  <th style={{ textAlign:'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="sa-row">
                    <td>{u.name}</td>
                    <td style={{ color:'#cfe3ff' }}>{u.email}</td>
                    <td style={{ textAlign:'center' }}>
                      {u.role === 2 && <span className="sa-role sa-role--super">SuperAdmin</span>}
                      {u.role === 1 && <span className="sa-role sa-role--admin">Admin</span>}
                      {u.role === 0 && <span className="sa-role sa-role--user">User</span>}
                    </td>
                    <td>
                      <div className="sa-actions">
                        {u.role === 0 && (
                          <>
                            <button className="sa-btn sa-btn--blue" disabled={busy} onClick={() => makeAdmin(u.id)}>Make Admin</button>
                            <button className="sa-btn sa-btn--purple" disabled={busy} onClick={() => makeSuper(u.id)}>Make SuperAdmin</button>
                          </>
                        )}
                        {u.role === 1 && (
                          <>
                            <button className="sa-btn sa-btn--red" disabled={busy || isMe(u)} onClick={() => removeAdmin(u.id)}>Remove Admin</button>
                            <button className="sa-btn sa-btn--purple" disabled={busy} onClick={() => makeSuper(u.id)}>Make SuperAdmin</button>
                          </>
                        )}
                        {u.role === 2 && (
                          <>
                            <button className="sa-btn sa-btn--yellow" disabled={busy || isMe(u) || isLastSuper(u)} onClick={() => removeSuper(u.id)}>Remove SuperAdmin</button>
                            <button className="sa-btn sa-btn--red" disabled={busy || isMe(u) || isLastSuper(u)} onClick={() => removeAdmin(u.id)}>Demote to User</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sa-subtle">SuperAdmins: {superCount}</div>
          </div>
        </div>
      </div>
    </>
  );
}

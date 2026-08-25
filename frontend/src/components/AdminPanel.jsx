import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

export default function AdminPanel({ token }) {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reports?status=pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUser = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Estado de usuario actualizado');
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Error actualizando estado');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        alert(`Rol actualizado a ${newRole}`);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Error cambiando rol');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Reporte marcado como ${status}`);
        fetchReports();
      } else {
        const data = await res.json();
        alert(data.message || 'Error resolviendo reporte');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>Panel de Administración</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button className="primary-btn" style={{ background: activeTab === 'users' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }} onClick={() => setActiveTab('users')}>Usuarios ({users.length})</button>
        <button className="primary-btn" style={{ background: activeTab === 'reports' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }} onClick={() => setActiveTab('reports')}>Reportes ({reports.length})</button>
      </div>

      {activeTab === 'users' && (
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px' }}>Nombre</th>
                <th style={{ padding: '16px' }}>Email</th>
                <th style={{ padding: '16px' }}>Rol</th>
                <th style={{ padding: '16px' }}>Estado</th>
                <th style={{ padding: '16px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>{u.name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      className="form-input" 
                      style={{ padding: '6px 10px', width: 'auto' }}
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                      background: u.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: u.is_active ? '#4ade80' : '#f87171' 
                    }}>
                      {u.is_active ? 'ACTIVO' : 'SUSPENDIDO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => handleToggleUser(u.id)}
                      style={{ 
                        background: 'transparent', border: '1px solid var(--border-color)', color: '#fff', 
                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' 
                      }}
                    >
                      {u.is_active ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px' }}>Tipo</th>
                <th style={{ padding: '16px' }}>ID Objetivo</th>
                <th style={{ padding: '16px' }}>Razón</th>
                <th style={{ padding: '16px' }}>Reportado Por</th>
                <th style={{ padding: '16px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay reportes pendientes.</td></tr>}
              {reports.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>{r.target_type.toUpperCase()}</td>
                  <td style={{ padding: '16px' }}>{r.target_id}</td>
                  <td style={{ padding: '16px', color: '#f87171' }}>{r.reason}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{r.reporter_name}</td>
                  <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleResolveReport(r.id, 'reviewed')}
                      style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Aprobar
                    </button>
                    <button 
                      onClick={() => handleResolveReport(r.id, 'dismissed')}
                      style={{ background: 'transparent', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Descartar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdEmojiEvents,
  MdFilterList,
  MdRefresh,
  MdSchool,
  MdSportsScore,
  MdScience,
  MdGroups,
} from 'react-icons/md';
import { FaTrophy } from 'react-icons/fa';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORIES = ['Academic', 'Sports', 'Cultural', 'Research', 'Community', 'General'];

const CATEGORY_COLORS = {
  Academic: { bg: '#dbeafe', color: '#2563eb' },
  Sports: { bg: '#d1fae5', color: '#059669' },
  Cultural: { bg: '#fce7f3', color: '#db2777' },
  Research: { bg: '#ede9fe', color: '#7c3aed' },
  Community: { bg: '#fef3c7', color: '#d97706' },
  General: { bg: '#f1f5f9', color: '#64748b' },
};

const emptyForm = {
  student_or_batch: '',
  award_or_title: '',
  description: '',
  year: new Date().getFullYear(),
  category: 'Academic',
  status: 'active',
};

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, years: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/achievement`);
      if (!res.ok) throw new Error('Failed to fetch achievements');
      const json = await res.json();
      if (json.achievements) {
        setAchievements(json.achievements);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAchievements(); }, []);

  const filtered = useMemo(() => {
    return achievements.filter(a => {
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchYear = yearFilter === 'All' || String(a.year) === yearFilter;
      const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        a.student_or_batch?.toLowerCase().includes(q) ||
        a.award_or_title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q);
      return matchStatus && matchYear && matchCat && matchSearch;
    });
  }, [achievements, search, yearFilter, categoryFilter, statusFilter]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item }); setModal(true); };
  const closeModal = () => { setModal(false); setEditItem(null); };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.student_or_batch || !form.award_or_title || !form.year) {
      alert('Student/Batch, Award Title and Year are required.');
      return;
    }
    setSaving(true);
    try {
      const url = editItem
        ? `${API_URL}/api/achievement/${editItem._id}`
        : `${API_URL}/api/achievement`;
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      closeModal();
      await fetchAchievements();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/achievement/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      await fetchAchievements();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async item => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await fetch(`${API_URL}/api/achievement/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchAchievements();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('This will reset all achievement records to the original 12 entries. Continue?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/achievement/seed`);
      if (!res.ok) throw new Error('Seed failed');
      await fetchAchievements();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const years = [...new Set(achievements.map(a => a.year))].sort((a, b) => b - a);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Student Achievements</h2>
          <p>Manage student awards, merit certificates, and competition achievements displayed on the website.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleSeed} disabled={loading} title="Reset to original 12 records">
            <MdRefresh /> Reset / Seed
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <MdAdd /> Add Achievement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Records', value: stats.total || achievements.length, icon: MdEmojiEvents, bg: 'rgba(75,46,131,0.1)', color: 'var(--primary)' },
          { label: 'Active', value: stats.active || achievements.filter(a => a.status === 'active').length, icon: FaTrophy, bg: '#d1fae5', color: '#059669' },
          { label: 'Academic Awards', value: achievements.filter(a => a.category === 'Academic').length, icon: MdSchool, bg: '#dbeafe', color: '#2563eb' },
          { label: 'Sports Awards', value: achievements.filter(a => a.category === 'Sports').length, icon: MdSportsScore, bg: '#d1fae5', color: '#059669' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ background: 'white', padding: '18px 20px', borderRadius: 12, border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                <Icon />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by student, award title, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="All">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="filter-count">{filtered.length} of {achievements.length} records</span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 200 }}>Student / Batch</th>
                <th>Award / Title</th>
                <th style={{ width: 260 }}>Description</th>
                <th style={{ width: 90 }}>Year</th>
                <th style={{ width: 110 }}>Category</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && achievements.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <MdEmojiEvents />
                      <p>No achievement records found.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((a, i) => {
                const cat = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.General;
                return (
                  <tr key={a._id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{a.sno || i + 1}</td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{a.student_or_batch}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.award_or_title}</span>
                    </td>
                    <td>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.description || '—'}
                      </p>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{a.year}</span>
                    </td>
                    <td>
                      <span style={{ background: cat.bg, color: cat.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {a.category}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(a)}
                        className={`badge ${a.status === 'active' ? 'badge-active' : 'badge-inactive'}`}
                        style={{ border: 'none', cursor: 'pointer', background: a.status === 'active' ? '#d1fae5' : '#fee2e2', color: a.status === 'active' ? '#059669' : '#dc2626' }}
                      >
                        <span className="badge-dot" style={{ background: a.status === 'active' ? '#059669' : '#dc2626' }}></span>
                        {a.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => openEdit(a)}><MdEdit /></button>
                        <button className="btn-danger" onClick={() => setDeleteConfirm(a._id)}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? 'Edit Achievement' : 'Add Achievement'}
        subtitle="Student award, merit certificate or competition achievement"
        icon={<MdEmojiEvents />}
        iconBg="rgba(75,46,131,0.1)"
        iconColor="var(--primary)"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editItem ? 'Update Achievement' : 'Add Achievement'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group full">
            <label className="form-label">Student / Batch <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Ms. Yaalnee (2021-2025)"
              value={form.student_or_batch}
              onChange={e => setForm(f => ({ ...f, student_or_batch: e.target.value }))}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Award / Title <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Certificate of Merit – Best Outgoing Student"
              value={form.award_or_title}
              onChange={e => setForm(f => ({ ...f, award_or_title: e.target.value }))}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Brief description of the achievement..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Year <span className="required">*</span></label>
            <input
              className="form-input"
              type="number"
              min="2000"
              max="2100"
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Achievement"
        subtitle="This action cannot be undone"
        icon={<MdDelete />}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={loading}
              style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Are you sure you want to permanently delete this achievement record?</p>
      </Modal>
    </div>
  );
}

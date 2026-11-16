import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdImage,
  MdRefresh,
  MdVisibility,
  MdVisibilityOff,
  MdClose,
  MdSchool,
} from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

const BADGE_OPTIONS = [
  'Undergraduate',
  'Postgraduate',
  'Diploma',
  'Certificate',
  'Doctoral',
];

const emptyForm = {
  title: '',
  fullName: '',
  badge: 'Undergraduate',
  duration: '4 Years Programme',
  desc: '',
  criteria: [''],
  order: 0,
  status: 'active',
  imageFile: null,
};

export default function Courses() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [badgeFilter, setBadgeFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/courses`);
      if (!res.ok) {
        let msg = 'Failed to fetch courses';
        try {
          const j = await res.json();
          msg = j.message || j.error || msg;
        } catch {
          /* ignored */
        }
        throw new Error(msg);
      }
      const json = await res.json();
      setData(json.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = data.filter((item) => {
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchBadge = badgeFilter === 'All' || item.badge?.toLowerCase() === badgeFilter.toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.fullName?.toLowerCase().includes(q) ||
      item.desc?.toLowerCase().includes(q) ||
      item.badge?.toLowerCase().includes(q);
    return matchStatus && matchBadge && matchSearch;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, order: data.length + 1 });
    setImagePreview(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      fullName: item.fullName || '',
      badge: item.badge || 'Undergraduate',
      duration: item.duration || '4 Years Programme',
      desc: item.desc || '',
      criteria: item.criteria && item.criteria.length > 0 ? [...item.criteria] : [''],
      order: item.order !== undefined ? item.order : 0,
      status: item.status || 'active',
      imageFile: null,
    });
    if (item.image) {
      setImagePreview(
        item.image.startsWith('http') ? item.image : `${API_URL}/uploads/${item.image}`
      );
    } else {
      setImagePreview(null);
    }
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditItem(null);
    setImagePreview(null);
    setSaving(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCriteriaChange = (index, value) => {
    const updated = [...form.criteria];
    updated[index] = value;
    setForm((prev) => ({ ...prev, criteria: updated }));
  };

  const addCriterion = () => {
    setForm((prev) => ({ ...prev, criteria: [...prev.criteria, ''] }));
  };

  const removeCriterion = (index) => {
    if (form.criteria.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Course title is required');
      return;
    }
    if (!form.fullName.trim()) {
      alert('Full course name is required');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('fullName', form.fullName.trim());
    formData.append('badge', form.badge.trim());
    formData.append('duration', form.duration.trim());
    formData.append('desc', form.desc.trim());
    formData.append('order', form.order);
    formData.append('status', form.status);

    const validCriteria = form.criteria.map((c) => c.trim()).filter(Boolean);
    formData.append('criteria', JSON.stringify(validCriteria));

    if (form.imageFile) {
      formData.append('image', form.imageFile);
    }

    try {
      const url = editItem
        ? `${API_URL}/api/courses/${editItem._id}`
        : `${API_URL}/api/courses`;
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        let msg = 'Failed to save course';
        try {
          const errJson = await res.json();
          msg = errJson.error || errJson.message || msg;
        } catch {
          /* ignored */
        }
        throw new Error(msg);
      }

      closeModal();
      await fetchCourses();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let msg = 'Failed to delete course';
        try {
          const j = await res.json();
          msg = j.error || j.message || msg;
        } catch {
          /* ignored */
        }
        throw new Error(msg);
      }
      setDeleteConfirm(null);
      await fetchCourses();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    setLoading(true);
    const toggledStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_URL}/api/courses/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toggledStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchCourses();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReseedDefaults = async () => {
    if (
      !window.confirm(
        'Reset and re-seed all 3 default courses (B.Sc., M.Sc., DGNM) with their complete criteria, duration, and images? Any custom changes will be overwritten.'
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/seed?force=true`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reseed courses');
      await fetchCourses();
      alert('Successfully reseeded default courses!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    return filename.startsWith('http') ? filename : `${API_URL}/uploads/${filename}`;
  };

  const getBadgeStyle = (badge) => {
    const b = (badge || '').toLowerCase();
    if (b.includes('undergraduate')) return { background: '#e0e7ff', color: '#3730a3' };
    if (b.includes('postgraduate')) return { background: '#fef3c7', color: '#92400e' };
    if (b.includes('diploma')) return { background: '#e0f2fe', color: '#0369a1' };
    return { background: '#f1f5f9', color: '#475569' };
  };

  return (
    <div>
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Courses Offered</h2>
          <p>
            Manage academic programmes, degree levels, durations, and admission criteria displayed on the website.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={handleReseedDefaults}
            disabled={loading}
            title="Reset and populate the 3 default nursing courses"
          >
            <MdRefresh /> Reseed Defaults
          </button>
          <button className="btn-primary" onClick={openAdd} disabled={loading}>
            <MdAdd /> Add Course
          </button>
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by title, full name, or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="filter-select"
          value={badgeFilter}
          onChange={(e) => setBadgeFilter(e.target.value)}
        >
          <option value="All">All Levels</option>
          {BADGE_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <span className="filter-count">
          {filtered.length} of {data.length} courses
        </span>
      </div>

      {/* ─── Error Notice ─── */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ⚠️ Error loading courses: {error}. Please verify the backend is running.
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th style={{ width: 80 }}>Image</th>
                <th style={{ width: 220 }}>Course Title</th>
                <th style={{ width: 140 }}>Level / Badge</th>
                <th style={{ width: 160 }}>Duration</th>
                <th>Description</th>
                <th style={{ width: 130 }}>Criteria</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading courses...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <MdSchool style={{ fontSize: 44, color: 'var(--text-muted)' }} />
                      <p>No courses found.</p>
                      <button
                        className="btn-secondary"
                        style={{ marginTop: 10 }}
                        onClick={handleReseedDefaults}
                      >
                        <MdRefresh /> Seed Default Courses
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const imgUrl = getImageUrl(item.image);
                  const badgeStyle = getBadgeStyle(item.badge);

                  return (
                    <tr key={item._id || index}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                          {item.order || index + 1}
                        </span>
                      </td>
                      <td>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.title}
                            style={{
                              width: 56,
                              height: 40,
                              borderRadius: 6,
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              background: '#f1f5f9',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 56,
                              height: 40,
                              borderRadius: 6,
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <MdImage size={18} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {item.fullName}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            ...badgeStyle,
                            padding: '3px 9px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            display: 'inline-block',
                          }}
                        >
                          {item.badge || 'Degree'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {item.duration}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: 340,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                          }}
                          title={item.desc}
                        >
                          {item.desc}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(14, 165, 233, 0.12)',
                            color: '#0284c7',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {item.criteria?.length || 0} criteria
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          title="Click to toggle status"
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <span
                            className={`badge ${
                              item.status === 'active' ? 'badge-success' : 'badge-danger'
                            }`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {item.status === 'active' ? (
                              <MdVisibility size={12} />
                            ) : (
                              <MdVisibilityOff size={12} />
                            )}
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(item)}
                            title="Edit Course"
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => setDeleteConfirm(item)}
                            title="Delete Course"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {modal && (
        <Modal
          open={true}
          size="lg"
          title={editItem ? `Edit Course: ${editItem.title}` : 'Add New Course'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  Course Title <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. B.Sc. Nursing"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Full Course Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Bachelor of Science in Nursing"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Level / Badge</label>
                <input
                  className="form-input"
                  list="badge-options"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="e.g. Undergraduate, Postgraduate, Diploma"
                />
                <datalist id="badge-options">
                  {BADGE_OPTIONS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  className="form-input"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 4 Years Programme"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  placeholder="1, 2, 3..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="form-textarea"
                required
                rows={3}
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                placeholder="Comprehensive description of the programme..."
              />
            </div>

            {/* Admission Criteria Dynamic List */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Admission Criteria</span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '3px 10px', fontSize: 12 }}
                  onClick={addCriterion}
                >
                  <MdAdd /> Add Criterion
                </button>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {form.criteria.map((crit, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>
                      {idx + 1}.
                    </span>
                    <input
                      className="form-input"
                      value={crit}
                      onChange={(e) => handleCriteriaChange(idx, e.target.value)}
                      placeholder={`Criterion #${idx + 1} (e.g. 10+2 with Science & English)`}
                      style={{ flex: 1 }}
                    />
                    {form.criteria.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => removeCriterion(idx)}
                        title="Remove"
                      >
                        <MdClose />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div className="form-group">
              <label className="form-label">Course Cover Image</label>
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {imagePreview && (
              <div style={{ marginBottom: 8 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Image Preview:
                </label>
                <div style={{ marginTop: 6 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxHeight: 140,
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <Modal
          open={true}
          title="Delete Course"
          onClose={() => setDeleteConfirm(null)}
        >
          <p style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong> ({deleteConfirm.fullName})? This course will no longer be visible on the frontend.
          </p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDeleteConfirm(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => handleDelete(deleteConfirm._id)}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


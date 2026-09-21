import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdCloudUpload, MdPictureAsPdf, MdBook } from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PAGE_SIZE = 10;

const emptyForm = { title: '', status: 'active', pdfFile: null };

export default function Statutes() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch statutes on mount
  const fetchStatutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/statutes`);
      if (!res.ok) {
        let errMsg = 'Failed to fetch statutes';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatutes();
  }, []);

  const filtered = data.filter(d =>
    (statusFilter === 'All' || d.status === statusFilter) &&
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // Keep the selected page valid after deleting or filtering records.
  if (page !== currentPage) setPage(currentPage);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, status: item.status || 'active', pdfFile: null });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditItem(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024)) {
      alert('Please select a PDF file up to 10MB');
      e.target.value = '';
      return;
    }
    if (file) {
      setForm(f => ({ ...f, pdfFile: file }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!editItem && !form.pdfFile) {
      alert('Please upload a PDF file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('status', form.status);
    if (form.pdfFile) {
      formData.append('pdfFile', form.pdfFile);
    }

    try {
      let res;
      if (editItem) {
        res = await fetch(`${API_URL}/api/statutes/${editItem._id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/api/statutes/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        let errMsg = 'Failed to save statutes';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        } else {
          const errText = await res.text();
          console.error('Server error response:', errText);
          errMsg = `Server error (${res.status}): ${res.statusText || 'Internal Server Error'}`;
        }
        throw new Error(errMsg);
      }

      closeModal();
      await fetchStatutes();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/statutes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        let errMsg = 'Failed to delete statutes';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      setDeleteConfirm(null);
      await fetchStatutes();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus, title) => {
    if (loading) return;
    setLoading(true);
    const toggledStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const formData = new FormData();
    formData.append('title', title);
    formData.append('status', toggledStatus);
    
    try {
      const res = await fetch(`${API_URL}/api/statutes/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        let errMsg = 'Failed to toggle status';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        } else {
          const errText = await res.text();
          console.error('Server error response:', errText);
          errMsg = `Server error (${res.status}): ${res.statusText || 'Internal Server Error'}`;
        }
        throw new Error(errMsg);
      }
      
      await fetchStatutes();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Statutory Disclosure</h2>
          <p>Publish, view, and manage statutory disclosure documents in PDF format.</p>
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={loading}>
          <MdAdd /> Upload Statute
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search statutes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="filter-count">
          {filtered.length} of {data.length} statutes
        </span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading statutes: {error}. Please verify the backend is running.
        </div>
      )}

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Status</th>
                <th>Uploaded On</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading statutes...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <MdBook />
                      <p>No statutes found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((item, i) => (
                  <tr key={item._id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{startIndex + i + 1}</td>
                    <td>
                      <span className="cell-primary">{item.title}</span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span 
                          className={`badge ${item.status === 'active' ? 'badge-active' : 'badge-inactive'}`}
                          style={{ cursor: loading ? 'not-allowed' : 'pointer', userSelect: 'none' }}
                          onClick={() => handleToggleStatus(item._id, item.status, item.title)}
                        >
                          <span className="badge-dot"></span>{item.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <a
                        href={`${API_URL}/uploads/${item.fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view"
                        style={{ display: 'inline-flex', textDecoration: 'none' }}
                      >
                        <MdPictureAsPdf /> View PDF
                      </a>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => openEdit(item)} disabled={loading}>
                          <MdEdit /> Edit
                        </button>
                        <button className="btn-danger" onClick={() => setDeleteConfirm(item._id)} disabled={loading}>
                          <MdDelete /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {filtered.length ? startIndex + 1 : 0} to {startIndex + pageItems.length} of {filtered.length} entries
          </span>
          <div className="pagination-btns">
            <button type="button" className="page-btn" aria-label="Previous page" disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)}>&lsaquo;</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(number => (
              <button
                type="button"
                key={number}
                className={`page-btn${currentPage === number ? ' active' : ''}`}
                aria-label={`Page ${number}`}
                aria-current={currentPage === number ? 'page' : undefined}
                disabled={loading}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ))}
            <button type="button" className="page-btn" aria-label="Next page" disabled={loading || currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>&rsaquo;</button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? 'Edit Statute' : 'Upload Statute'}
        subtitle="Publish a statutory disclosure PDF on the site"
        icon={<MdBook />}
        iconBg="#dbeafe"
        iconColor="#2563eb"
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : editItem ? 'Update Statute' : 'Upload Statute'}
            </button>
          </>
        }
      >
        <div className="form-grid cols-1">
          <div className="form-group">
            <label className="form-label">Statute Title <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. INC 2019 - 2020"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 13, color: form.status === 'inactive' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: form.status === 'inactive' ? 600 : 400, userSelect: 'none' }}>Inactive</span>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: 44,
                height: 24,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={form.status === 'active'}
                  onChange={e => setForm({ ...form, status: e.target.checked ? 'active' : 'inactive' })}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: form.status === 'active' ? 'var(--success)' : '#cbd5e1',
                  transition: '0.2s',
                  borderRadius: 24,
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: 18, width: 18,
                    left: form.status === 'active' ? 22 : 4,
                    bottom: 3,
                    backgroundColor: 'white',
                    transition: '0.2s',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
              <span style={{ fontSize: 13, color: form.status === 'active' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: form.status === 'active' ? 600 : 400, userSelect: 'none' }}>Active</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              PDF File {editItem ? '(Leave empty to keep existing)' : <span className="required">*</span>}
            </label>
            <label className="image-upload-area" style={{ borderStyle: 'dashed', background: '#f8fafc' }}>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
              <div>
                <div className="upload-icon"><MdCloudUpload /></div>
                <div className="upload-text">
                  <p>
                    <strong>
                      {form.pdfFile ? form.pdfFile.name : 'Click to select PDF file'}
                    </strong>
                  </p>
                  <span>PDF format only — up to 10MB</span>
                </div>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Statute"
        subtitle="This action cannot be undone"
        icon={<MdDelete />}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => handleDelete(deleteConfirm)}
              disabled={loading}
              style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Are you sure you want to delete this statutes? The PDF file and database record will be permanently removed.
        </p>
      </Modal>
    </div>
  );
}

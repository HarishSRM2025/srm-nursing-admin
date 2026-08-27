import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdCloudUpload, MdPeople, MdLayers, MdImage } from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const emptyForm = {
  Name: '',
  Designation: '',
  Degree: '',
  Message: '',
  Status: 'active',
  order: 0,
  profileImageFile: null
};

export default function Leadership() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch leadership list
  const fetchLeadership = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/leadership/get`);
      if (!res.ok) {
        let errMsg = 'Failed to fetch leadership members';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      const json = await res.json();
      setData(json.leadership || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadership();
  }, []);

  const filtered = data.filter(d =>
    (statusFilter === 'All' || d.Status === statusFilter) &&
    (d.Name.toLowerCase().includes(search.toLowerCase()) ||
     d.Designation.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setImagePreview(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      Name: item.Name,
      Designation: item.Designation,
      Degree: item.Degree || '',
      Message: item.Message,
      Status: item.Status || 'active',
      order: item.order || 0,
      profileImageFile: null
    });
    // Set initial image preview URL (either backend uploads or placeholder)
    if (item.ProfileImage) {
      const isDefault = ['chairman.jpg', 'principal.jpeg', 'vp.png'].includes(item.ProfileImage);
      if (isDefault) {
        setImagePreview(null); // Will show icon or message for default
      } else {
        setImagePreview(`${API_URL}/uploads/${item.ProfileImage}`);
      }
    } else {
      setImagePreview(null);
    }
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditItem(null);
    setImagePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, profileImageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.Name.trim()) {
      alert('Name is required');
      return;
    }
    if (!form.Designation.trim()) {
      alert('Designation is required');
      return;
    }
    if (!form.Message.trim()) {
      alert('Message/Speech is required');
      return;
    }
    if (!editItem && !form.profileImageFile) {
      alert('Please upload a profile image');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('Name', form.Name.trim());
    formData.append('Designation', form.Designation.trim());
    formData.append('Degree', form.Degree.trim());
    formData.append('Message', form.Message.trim());
    formData.append('Status', form.Status);
    formData.append('order', Number(form.order));
    if (form.profileImageFile) {
      formData.append('ProfileImage', form.profileImageFile);
    }

    try {
      let res;
      if (editItem) {
        res = await fetch(`${API_URL}/api/leadership/update/${editItem._id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/api/leadership/create`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        let errMsg = 'Failed to save leadership member';
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
      await fetchLeadership();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leadership/delete/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        let errMsg = 'Failed to delete leadership member';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      setDeleteConfirm(null);
      await fetchLeadership();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setLoading(true);
    const toggledStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const formData = new FormData();
    formData.append('Status', toggledStatus);
    
    try {
      const res = await fetch(`${API_URL}/api/leadership/update/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        let errMsg = 'Failed to toggle status';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      
      await fetchLeadership();
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
          <h2>Leadership Management</h2>
          <p>Configure, add, and update the visionary leaders shown on the college website homepage.</p>
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={loading}>
          <MdAdd /> Add Leader
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by name or designation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="filter-count">
          {filtered.length} of {data.length} leaders
        </span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading leadership: {error}. Please verify the backend is running.
        </div>
      )}

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Degree</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading leadership...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <MdPeople />
                      <p>No leaders found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isDefaultImage = ['chairman.jpg', 'principal.jpeg', 'vp.png'].includes(item.ProfileImage);
                  const imageSrc = isDefaultImage 
                    ? `(Frontend Default Image)`
                    : `${API_URL}/uploads/${item.ProfileImage}`;

                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)', width: 60 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MdLayers style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                          {item.order}
                        </span>
                      </td>
                      <td>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {!isDefaultImage ? (
                            <img src={imageSrc} alt={item.Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ fontSize: 10, fontWeight: 'bold', color: '#475569', textAlign: 'center', padding: 2 }}>{item.ProfileImage.split('.')[0].toUpperCase()}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="cell-primary">{item.Name}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.Designation}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {item.Degree || 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span 
                            className={`badge ${item.Status === 'active' ? 'badge-active' : 'badge-inactive'}`}
                            style={{ cursor: loading ? 'not-allowed' : 'pointer', userSelect: 'none' }}
                            onClick={() => handleToggleStatus(item._id, item.Status)}
                          >
                            <span className="badge-dot"></span>{item.Status}
                          </span>
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? 'Edit Leader' : 'Add Leader'}
        subtitle="Configure visionary member profile"
        icon={<MdPeople />}
        iconBg="#dbeafe"
        iconColor="#2563eb"
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : editItem ? 'Update Leader' : 'Add Leader'}
            </button>
          </>
        }
      >
        <div className="form-grid cols-2">
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Dr. R. Shivakumar"
              value={form.Name}
              onChange={e => setForm({ ...form, Name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Designation <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Chairman"
              value={form.Designation}
              onChange={e => setForm({ ...form, Designation: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Degree / Qualifications</label>
            <input
              className="form-input"
              placeholder="e.g. M.Sc Nursing, Ph.D"
              value={form.Degree}
              onChange={e => setForm({ ...form, Degree: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 1"
              value={form.order}
              onChange={e => setForm({ ...form, order: Number(e.target.value) })}
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 13, color: form.Status === 'inactive' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: form.Status === 'inactive' ? 600 : 400, userSelect: 'none' }}>Inactive</span>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: 44,
                height: 24,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={form.Status === 'active'}
                  onChange={e => setForm({ ...form, Status: e.target.checked ? 'active' : 'inactive' })}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: form.Status === 'active' ? 'var(--success)' : '#cbd5e1',
                  transition: '0.2s',
                  borderRadius: 24,
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: 18, width: 18,
                    left: form.Status === 'active' ? 22 : 4,
                    bottom: 3,
                    backgroundColor: 'white',
                    transition: '0.2s',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
              <span style={{ fontSize: 13, color: form.Status === 'active' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: form.Status === 'active' ? 600 : 400, userSelect: 'none' }}>Active</span>
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Message / Speech <span className="required">*</span></label>
            <textarea
              className="form-input"
              rows={6}
              placeholder="Enter the message/speech text here..."
              value={form.Message}
              onChange={e => setForm({ ...form, Message: e.target.value })}
              disabled={loading}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">
              Profile Image {editItem ? '(Leave empty to keep existing)' : <span className="required">*</span>}
            </label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label className="image-upload-area" style={{ borderStyle: 'dashed', background: '#f8fafc', flex: 1, margin: 0, cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <div className="upload-icon" style={{ fontSize: 24, color: 'var(--primary)' }}><MdCloudUpload /></div>
                  <div className="upload-text" style={{ fontSize: 12 }}>
                    <p style={{ margin: 0 }}><strong>{form.profileImageFile ? form.profileImageFile.name : 'Click to select image'}</strong></p>
                    <span style={{ color: 'var(--text-muted)' }}>JPG, PNG or WEBP — up to 5MB</span>
                  </div>
                </div>
              </label>
              {imagePreview && (
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {editItem && !form.profileImageFile && ['chairman.jpg', 'principal.jpeg', 'vp.png'].includes(editItem.ProfileImage) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 80, height: 80, padding: 8, borderRadius: 8, border: '1px dashed var(--border-light)', background: '#f8fafc', justifyContent: 'center' }}>
                  <MdImage style={{ fontSize: 24, color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 9, textAlign: 'center', color: 'var(--text-secondary)' }}>Using local fallback</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Leader Profile"
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
          Are you sure you want to delete this leadership member profile? The database record will be permanently removed.
        </p>
      </Modal>
    </div>
  );
}

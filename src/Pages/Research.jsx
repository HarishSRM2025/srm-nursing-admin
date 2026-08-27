import React, { useState, useEffect, useMemo } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdScience,
  MdRefresh,
  MdCheckCircle,
  MdCalendarToday,
  MdPerson,
  MdSchool,
  MdFilterList
} from 'react-icons/md';
import Modal from '../Components/Common/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const emptyForm = {
  faculty_name: '',
  title: '',
  description: '',
  year: new Date().getFullYear(),
  status: 'active',
  institution: 'SRM TRICHY COLLEGE OF NURSING',
  document_title: 'FACULTY PUBLICATIONS & CERTIFICATIONS'
};

const ITEMS_PER_PAGE = 10;

export default function Research() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [facultyFilter, setFacultyFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch publications on mount
  const fetchPublications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/publication`);
      if (!res.ok) {
        let errMsg = 'Failed to fetch publications';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      const json = await res.json();
      if (json && json.publications) {
        setData(json.publications);
      } else if (Array.isArray(json)) {
        setData(json);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  // Compute unique years and faculty names for filters
  const uniqueYears = useMemo(() => {
    const set = new Set(data.map(d => d.year).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueFaculty = useMemo(() => {
    const set = new Set(data.map(d => d.faculty_name).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  // Filtered data
  const filtered = useMemo(() => {
    return data.filter(d => {
      const matchStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchYear = yearFilter === 'All' || String(d.year) === String(yearFilter);
      const matchFaculty = facultyFilter === 'All' || d.faculty_name === facultyFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.faculty_name && d.faculty_name.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q));

      return matchStatus && matchYear && matchFaculty && matchSearch;
    });
  }, [data, search, statusFilter, yearFilter, facultyFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      faculty_name: item.faculty_name || '',
      title: item.title || '',
      description: item.description || '',
      year: item.year || new Date().getFullYear(),
      status: item.status || 'active',
      institution: item.institution || 'SRM TRICHY COLLEGE OF NURSING',
      document_title: item.document_title || 'FACULTY PUBLICATIONS & CERTIFICATIONS'
    });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.faculty_name.trim()) {
      alert('Faculty name is required');
      return;
    }
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!form.year) {
      alert('Year is required');
      return;
    }

    setLoading(true);
    try {
      const url = editItem
        ? `${API_URL}/api/publication/${editItem._id}`
        : `${API_URL}/api/publication`;
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        let errMsg = 'Failed to save publication';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }

      closeModal();
      await fetchPublications();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/publication/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        let errMsg = 'Failed to delete publication';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.message || errMsg;
        }
        throw new Error(errMsg);
      }
      setDeleteConfirm(null);
      await fetchPublications();
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
      const res = await fetch(`${API_URL}/api/publication/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          status: toggledStatus
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      await fetchPublications();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('Reset/Seed all 44 default faculty publications? This will refresh all standard entries.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/publication/seed`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to seed publications');
      }
      await fetchPublications();
      alert('Successfully seeded 44 faculty publications!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Faculty Publications & Certifications</h2>
          <p>Manage faculty research papers, journals, certifications, and awards.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleSeedDefaults} disabled={loading} title="Re-populate default records">
            <MdRefresh /> Reset / Seed
          </button>
          <button className="btn-primary" onClick={openAdd} disabled={loading}>
            <MdAdd /> Add Publication
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: 'white',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(75, 46, 131, 0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22
          }}>
            <MdScience />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{data.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Records</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22
          }}>
            <MdCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.filter(d => d.status === 'active').length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active Publications</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(15, 140, 166, 0.1)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22
          }}>
            <MdPerson />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{uniqueFaculty.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Faculty Members</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22
          }}>
            <MdCalendarToday />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{uniqueYears.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Years Active</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="search-input"
            placeholder="Search by title, faculty, or keywords..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="filter-select"
          value={facultyFilter}
          onChange={e => {
            setFacultyFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All Faculty</option>
          {uniqueFaculty.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={yearFilter}
          onChange={e => {
            setYearFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All Years</option>
          {uniqueYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <span className="filter-count">
          {filtered.length} of {data.length} records
        </span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ Error loading publications: {error}. Please verify the backend server is running.
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th style={{ width: 180 }}>Faculty</th>
                <th>Publication / Certification Title</th>
                <th style={{ width: 90 }}>Year</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading publications...</div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <MdScience />
                      <p>No publications found matching your filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, i) => {
                  const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                  return (
                    <tr key={item._id || itemIndex}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{itemIndex}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {item.faculty_name ? item.faculty_name.charAt(0) : 'F'}
                          </div>
                          <div>
                            <span className="cell-primary" style={{ fontSize: 13, fontWeight: 600 }}>
                              {item.faculty_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.35 }}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          background: 'rgba(75, 46, 131, 0.08)',
                          color: 'var(--primary)',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12
                        }}>
                          {item.year}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${item.status === 'active' ? 'badge-active' : 'badge-inactive'}`}
                          style={{ cursor: loading ? 'not-allowed' : 'pointer', userSelect: 'none' }}
                          onClick={() => handleToggleStatus(item)}
                          title="Click to toggle status"
                        >
                          <span className="badge-dot"></span>{item.status || 'active'}
                        </span>
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

        {/* Pagination */}
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
          </span>
          <div className="pagination-btns">
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => {
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
              }
              return null;
            })}
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? 'Edit Publication' : 'Add New Publication'}
        subtitle="Manage faculty research papers, journals, and certifications"
        icon={<MdScience />}
        iconBg="rgba(75, 46, 131, 0.1)"
        iconColor="var(--primary)"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : editItem ? 'Update Publication' : 'Add Publication'}
            </button>
          </>
        }
      >
        <div className="form-grid cols-2">
          <div className="form-group">
            <label className="form-label">Faculty Name <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Dr. Suja Suresh"
              value={form.faculty_name}
              onChange={e => setForm({ ...form, faculty_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Publication Year <span className="required">*</span></label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 2026"
              min="2000"
              max="2035"
              value={form.year}
              onChange={e => setForm({ ...form, year: Number(e.target.value) })}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Title / Paper Topic <span className="required">*</span></label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="e.g. Effectiveness of Need Based Social Awareness Programme..."
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Description / Journal & Certificate Details</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="e.g. Certificate of Publication (co-authored with Sarmila A), International Journal..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-grid cols-2" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Institution</label>
            <input
              className="form-input"
              value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })}
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
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Publication"
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
          Are you sure you want to delete this publication record? It will be permanently removed from the system and frontend.
        </p>
      </Modal>
    </div>
  );
}

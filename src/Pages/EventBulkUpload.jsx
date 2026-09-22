import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdCloudUpload, MdDownload, MdArrowBack } from 'react-icons/md';
import '../assets/styles/event-bulk-upload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EventBulkUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const inputRef = useRef(null);
  const submitting = useRef(false);

  const selectFile = event => {
    const selected = event.target.files?.[0];
    setError('');
    setReport(null);
    setFile(null);
    if (!selected) return;
    if (!/\.xlsx$/i.test(selected.name) || selected.size > 10 * 1024 * 1024) {
      setError('Choose an .xlsx Excel file no larger than 10 MB.');
      event.target.value = '';
      return;
    }
    setFile(selected);
  };

  const upload = async event => {
    event.preventDefault();
    if (!file || submitting.current) return;
    submitting.current = true;
    setUploading(true);
    setError('');
    setReport(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await fetch(`${API_URL}/api/events/bulk-upload`, { method: 'POST', body });
      const json = await response.json().catch(() => null);
      // 207 is a partial import; 422 still contains useful row-level failures.
      if ([201, 207, 422].includes(response.status) && Array.isArray(json?.results)) {
        setReport(json);
      } else {
        throw new Error(json?.message || `Upload failed (HTTP ${response.status}). Check that the backend supports bulk uploads.`);
      }
    } catch (err) {
      setError(`${err.message} If the connection was interrupted, check the events list before retrying to avoid duplicates.`);
    } finally {
      // Require an explicit selection for another import instead of resubmitting completed rows.
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      submitting.current = false;
      setUploading(false);
    }
  };

  return (
    <div className="event-import">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Bulk Upload Events</h2>
          <p>Create multiple events from an Excel spreadsheet.</p>
        </div>
        <Link className="btn-secondary" to="/news-events"><MdArrowBack /> View Events</Link>
      </div>

      <section className="table-card event-import-card">
        <div className="event-import-heading">
          <h3>Prepare your spreadsheet</h3>
          <a className="btn-secondary" href={`${import.meta.env.BASE_URL}templates/events-import-template.xlsx`} download>
            <MdDownload /> Download Excel Template
          </a>
        </div>
        <p>Replace the sample row with your events. The first sheet is imported, with one event per row and a required title. Upload up to 500 events at a time.</p>
        <p>In the <strong>image</strong> column, separate image paths with commas:</p>
        <code className="event-import-example">uploads/2023/11/event1.png, uploads/2023/11/event2.png</code>
        <p>The images must already be in the project's uploads folder on the backend server. They are matched to each event automatically.</p>
        <details>
          <summary>Column names and date format</summary>
          <p>title, description, startDate, endDate, venue, category, tags, image, status, registrationFee, isActive, registrationLink</p>
          <p>Use Excel date cells or ISO dates such as 2026-10-01. For local times, include the offset, for example 2026-10-01T09:00:00+05:30. Separate tags with commas.</p>
          <p>Status: Upcoming, Ongoing, Completed, or Cancelled. Active state: ACTIVE or INACTIVE. Blank values default to Upcoming and ACTIVE.</p>
        </details>
      </section>

      <form className="table-card event-import-card" onSubmit={upload} aria-busy={uploading}>
        <label className="form-label" htmlFor="events-workbook">Excel spreadsheet (.xlsx)</label>
        <input ref={inputRef} id="events-workbook" className="form-input" type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={selectFile} disabled={uploading} aria-describedby="events-upload-help" />
        <p id="events-upload-help">Maximum file size: 10 MB. Each upload creates new events. Upload only failed rows when retrying a partial import.</p>
        {file && <p>Selected: <strong>{file.name}</strong></p>}
        <button className="btn-primary" type="submit" disabled={!file || uploading}>
          <MdCloudUpload /> {uploading ? 'Importing events...' : 'Upload & Import Events'}
        </button>
        {uploading && <p role="status">Processing your spreadsheet and images. Keep this page open until the results appear.</p>}
        {error && <p className="event-import-error" role="alert">{error}</p>}
      </form>

      {report && (
        <section className="table-card event-import-card" aria-label="Import results">
          <h3>Import results</h3>
          <p role="status"><strong>{report.total}</strong> total · <strong>{report.imported}</strong> imported · <strong>{report.failed}</strong> failed</p>
          {report.failed > 0 && <p>Correct the errors below and upload only the failed rows. Successfully imported rows are already saved.</p>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Excel row</th><th>Event</th><th>Result</th><th>Details</th></tr></thead>
              <tbody>
                {report.results.map(result => (
                  <tr key={result.row}>
                    <td>{result.row}</td>
                    <td>{result.title || '(No title)'}</td>
                    <td><span className={`badge ${result.success ? 'badge-active' : 'badge-inactive'}`}>{result.success ? 'Imported' : 'Failed'}</span></td>
                    <td>{result.success ? `${result.imageCount} image(s) saved` : result.error}
                      {result.warning && <p className="event-import-error">{result.warning}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link className="btn-secondary" to="/news-events">View Events</Link>
        </section>
      )}
    </div>
  );
}

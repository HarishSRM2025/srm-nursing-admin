import { useRef, useState } from 'react';

export default function ResearchBulkUpload({ endpoint, onImported }) {
  const input = useRef(null);
  const busy = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const upload = async event => {
    event.preventDefault();
    if (busy.current) return;
    setError('');
    setReport(null);
    const file = input.current.files?.[0];
    if (!file || !/\.xlsx$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
      setError('Choose an .xlsx file no larger than 10 MB.');
      return;
    }
    busy.current = true;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`${endpoint}/bulk-upload`, { method: 'POST', body });
      const json = await response.json();
      if (![201, 207, 422].includes(response.status) || !Array.isArray(json.results)) {
        throw new Error(json.message || 'Upload failed');
      }
      setReport(json);
      if (json.imported) await onImported();
    } catch (err) {
      setError(`${err.message}. Check the research list before retrying an interrupted upload.`);
    } finally {
      if (input.current) input.current.value = '';
      busy.current = false;
      setUploading(false);
    }
  };

  return (
    <div>
      <p>Upload up to 500 research records from the first Excel sheet. Each upload adds new records.</p>
      <a className="btn-secondary" href={`${endpoint}/template`} download>Download Blank Template</a>
      <p>Required: title, year (1900-9999).</p>
      <p>Optional: researcher_name, description, status, institution, document_title. Status defaults to active.</p>
      <p>Status: active or inactive.</p>
      <form onSubmit={upload} aria-busy={uploading}>
        <label className="form-label" htmlFor="research-workbook">Excel file (maximum 10 MB)</label>
        <input id="research-workbook" className="form-input" type="file" accept=".xlsx" ref={input} disabled={uploading} required />
        <button className="btn-primary" type="submit" disabled={uploading} style={{ marginTop: 16 }}>
          {uploading ? 'Importing...' : 'Upload Research'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      {report && <div>
        <p role="status">{report.imported} imported; {report.failed} failed.</p>
        {report.failed > 0 && <p>Correct and upload only failed rows. Successful rows are already saved.</p>}
        <div className="table-wrap"><table>
          <thead><tr><th>Excel Row</th><th>Title</th><th>Result</th></tr></thead>
          <tbody>{report.results.map(result => <tr key={result.row}>
            <td>{result.row}</td><td>{result.title || '—'}</td><td>{result.success ? 'Imported' : result.error}</td>
          </tr>)}</tbody>
        </table></div>
      </div>}
    </div>
  );
}

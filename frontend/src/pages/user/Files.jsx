import { useState, useEffect } from 'react';
import {
  FolderOpen,
  UploadCloud,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  Download,
  Trash2,
  Search,
  Loader2
} from 'lucide-react';
import { fileService } from '../../services';
import toast from 'react-hot-toast';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fileService.getFiles();
      const list = res.data?.data || res.data?.files || (Array.isArray(res.data) ? res.data : []);
      setFiles(list);
    } catch {
      // Empty fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await fileService.uploadFile(formData);
      toast.success('File uploaded successfully!');
      const created = res.data?.data || res.data?.file || res.data;
      if (created && created._id) {
        setFiles((prev) => [created, ...prev.filter((f) => f._id !== created._id)]);
      }
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await fileService.deleteFile(id);
      toast.success('File deleted');
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType = '') => {
    if (mimeType.startsWith('image/')) return <FileImage size={24} color="#3b82f6" />;
    if (mimeType.includes('zip') || mimeType.includes('tar')) return <FileArchive size={24} color="#f59e0b" />;
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html'))
      return <FileCode size={24} color="#10b981" />;
    return <FileText size={24} color="#6366f1" />;
  };

  const filteredFiles = files.filter((f) =>
    (f.originalName || f.name)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
            Files & Assets
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Central repository for team assets, attachments, and project documents
          </p>
        </div>

        {/* Upload Button */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.7 : 1,
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
          <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
          <input type="file" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 16px',
        maxWidth: 400
      }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search files by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: '100%',
            fontSize: '0.875rem',
            color: 'var(--text)',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Files Table / Grid */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FolderOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--text)' }}>No files uploaded</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Upload project documents, mockups, or specifications above.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>File Name</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Size</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Uploaded By</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {getFileIcon(file.mimetype)}
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {file.originalName || file.name || 'document'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {formatBytes(file.size || 0)}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {file.uploadedBy?.name || 'Workspace Member'}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {file.url && (
                        <a
                          href={file.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--primary)', cursor: 'pointer' }}
                        >
                          <Download size={16} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

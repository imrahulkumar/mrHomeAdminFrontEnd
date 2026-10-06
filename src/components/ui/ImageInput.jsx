import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

function useUploader(onUploaded) {
  const notify = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const { url } = await api.upload(file);
        onUploaded(url);
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return { uploading, inputRef, handleFiles };
}

/** Single image: paste a URL or upload a file. */
export function ImageInput({ value, onChange }) {
  const { uploading, inputRef, handleFiles } = useUploader(onChange);
  return (
    <div className="image-input">
      {value ? <img src={value} alt="" className="image-thumb" /> : <div className="image-thumb empty">No image</div>}
      <div className="image-input-controls">
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => inputRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          {value && <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>Remove</button>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles([...e.target.files])} />
      </div>
    </div>
  );
}

/** Multiple images (first one is the main image). */
export function ImageListInput({ value = [], onChange }) {
  const [url, setUrl] = useState('');
  const { uploading, inputRef, handleFiles } = useUploader((u) => onChange((prev) => [...prev, u]));

  const addUrl = () => {
    if (!url.trim()) return;
    onChange((prev) => [...prev, url.trim()]);
    setUrl('');
  };
  const remove = (i) => onChange((prev) => prev.filter((_, idx) => idx !== i));
  const makeMain = (i) => onChange((prev) => [prev[i], ...prev.filter((_, idx) => idx !== i)]);

  return (
    <div className="image-list">
      <div className="image-grid">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="image-tile">
            <img src={src} alt="" />
            {i === 0 && <span className="badge badge-main">Main</span>}
            <div className="image-tile-actions">
              {i > 0 && <button type="button" onClick={() => makeMain(i)} title="Make main image">★</button>}
              <button type="button" onClick={() => remove(i)} title="Remove">✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="image-tile image-add" onClick={() => inputRef.current.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '+ Upload'}
        </button>
      </div>
      <div className="row">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
        <button type="button" className="btn btn-sm" onClick={addUrl}>Add URL</button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles([...e.target.files])} />
    </div>
  );
}

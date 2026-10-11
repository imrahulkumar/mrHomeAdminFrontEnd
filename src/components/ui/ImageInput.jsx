import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const MAX_UPLOAD_MB = 4; // matches the backend limit (Vercel rejects bodies over ~4.5MB)

function useUploader(onUploaded) {
  const notify = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
          notify(`"${file.name}" is larger than ${MAX_UPLOAD_MB}MB. Please choose a smaller image.`, 'error');
          continue;
        }
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

const SOURCES = [
  { id: 'url', label: 'Image URL' },
  { id: 'upload', label: 'Upload image' },
];

/** Builds { source, url, upload } for settings saved before media sources existed. */
export function toMedia(media, legacyUrl = '') {
  if (media?.url || media?.upload || !legacyUrl) return { source: 'url', url: '', upload: '', ...media };
  const uploaded = legacyUrl.includes('/api/uploads/');
  return { source: uploaded ? 'upload' : 'url', url: uploaded ? '' : legacyUrl, upload: uploaded ? legacyUrl : '' };
}

/**
 * Image that comes from either a pasted URL or an upload. Both values are kept, so switching
 * source never loses the other one; `value.source` decides which the store shows.
 */
export function ImageSourceInput({ value, onChange, wide = false }) {
  const media = toMedia(value);
  const update = (patch) => onChange({ ...media, ...patch });
  const { uploading, inputRef, handleFiles } = useUploader((upload) => update({ upload }));
  const [dragging, setDragging] = useState(false);
  const shown = media[media.source];

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    if (files.length) handleFiles(files.slice(0, 1));
  };

  return (
    <div className="image-source">
      <div className="segmented" role="radiogroup">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={media.source === s.id}
            className={media.source === s.id ? 'active' : ''}
            onClick={() => update({ source: s.id })}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={`image-source-body ${wide ? 'wide' : ''}`}>
        {shown ? <img src={shown} alt="" className="image-preview" /> : <div className="image-preview empty">No image</div>}

        {media.source === 'url' ? (
          <div className="image-input-controls">
            <input value={media.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://example.com/image.jpg" />
            <span className="field-hint">Paste a direct link to an image hosted anywhere.</span>
            {media.url && (
              <div className="row"><button type="button" className="btn btn-sm btn-ghost" onClick={() => update({ url: '' })}>Clear URL</button></div>
            )}
          </div>
        ) : (
          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <p>{uploading ? 'Uploading…' : 'Drag an image here, or'}</p>
            <div className="row">
              <button type="button" className="btn btn-sm" onClick={() => inputRef.current.click()} disabled={uploading}>
                {media.upload ? 'Replace image' : 'Choose file'}
              </button>
              {media.upload && <button type="button" className="btn btn-sm btn-ghost" onClick={() => update({ upload: '' })}>Remove</button>}
            </div>
            <span className="field-hint">PNG, JPG, WebP or SVG, up to {MAX_UPLOAD_MB}MB.</span>
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles([...e.target.files].slice(0, 1))} />
          </div>
        )}
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

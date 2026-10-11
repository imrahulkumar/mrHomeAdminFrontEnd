import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ErrorState, Loader, PageHeader } from '../components/ui/Common';
import { Field, FormGrid, FormSection, Toggle } from '../components/ui/Form';
import { ImageSourceInput, toMedia } from '../components/ui/ImageInput';
import { useToast } from '../context/ToastContext';
import { THEMES, getTheme } from '../utils/themes';

// Fill in image sources for settings saved before they existed.
const normalize = (s) => ({
  ...s,
  logoMedia: toMedia(s.logoMedia, s.logo),
  hero: { ...s.hero, imageMedia: toMedia(s.hero?.imageMedia, s.hero?.image) },
  theme: { preset: 'classic', customColors: true, ...s.theme },
});

const shownImage = (media) => media?.[media.source] ?? '';

/** A miniature storefront rendered with the chosen theme, logo and banner. */
function ThemePreview({ form }) {
  const t = getTheme(form.theme.preset);
  const accent = form.theme.customColors ? form.theme.primaryColor : t.accent;
  const accentDark = form.theme.customColors ? form.theme.primaryDark : t.accentDark;
  const logo = shownImage(form.logoMedia);
  const heroImage = shownImage(form.hero.imageMedia);
  const btn = { background: accent, color: t.onAccent ?? '#fff', borderRadius: t.btnRadius };

  return (
    <div className="theme-preview" style={{ background: t.bg, color: t.ink, fontFamily: t.body, borderColor: t.border }}>
      {form.announcement && <div className="tp-announce" style={{ background: t.announce[0], color: t.announce[1] }}>{form.announcement}</div>}
      <div className="tp-nav" style={{ background: t.surface, borderColor: t.border }}>
        <span className="tp-brand" style={{ fontFamily: t.heading }}>
          {logo ? <img src={logo} alt="" /> : <span style={{ color: accent }}>◆</span>}
          {form.siteName}
        </span>
        <span className="tp-cart" style={{ color: t.muted }}>Cart</span>
      </div>
      <div className="tp-body">
        <div
          className="tp-hero"
          style={{
            borderRadius: t.radius,
            background: heroImage ? `linear-gradient(90deg, rgba(20,15,10,.75), rgba(20,15,10,.2)), url(${heroImage}) center / cover` : t.hero,
          }}
        >
          <strong style={{ fontFamily: t.heading }}>{form.hero.title}</strong>
          <span className="tp-btn" style={btn}>{form.hero.ctaText || 'Shop now'}</span>
        </div>
        <div className="tp-cards">
          {['Gold Ring', 'Brass Vase'].map((name) => (
            <div key={name} className="tp-card" style={{ background: t.surface, borderColor: t.border, borderRadius: t.radius }}>
              <div className="tp-img" style={{ background: t.border }} />
              <span>{name}</span>
              <span style={{ color: accentDark, fontWeight: 700 }}>₹12,999</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const notify = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((s) => setForm(normalize(s))).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!form) return <Loader />;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key) => (value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  const text = (setter) => (e) => setter(e.target.value);

  // Picking a theme resets the accent to that theme's own colours; the admin can then customise it.
  const choosePreset = (id) => {
    const t = getTheme(id);
    setForm((f) => ({ ...f, theme: { ...f.theme, preset: id, customColors: false, primaryColor: t.accent, primaryDark: t.accentDark } }));
  };
  const theme = getTheme(form.theme.preset);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.put('/settings', {
        ...form,
        gstRate: Number(form.gstRate),
        shippingFee: Number(form.shippingFee),
        freeShippingThreshold: Number(form.freeShippingThreshold),
      });
      setForm(normalize(saved));
      notify('Settings saved. Refresh the store to see changes.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title="Site Settings"
        subtitle="Control the store's branding, home page, checkout and footer."
        actions={<button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>}
      />

      <div className="two-col">
        <div className="stack">
          <FormSection title="Theme" description="Changes the colours, fonts and shapes across the whole store.">
            <FormGrid>
              <Field label="Store theme" span={2} hint={theme.description}>
                <select value={form.theme.preset} onChange={(e) => choosePreset(e.target.value)}>
                  {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            </FormGrid>
            <div className="theme-swatches" aria-hidden>
              {[theme.bg, theme.surface, theme.accent, theme.accentDark, theme.ink].map((c, i) => <span key={i} style={{ background: c }} />)}
              <span className="muted small">{theme.heading.split(',')[0].replace(/'/g, '')} headings · {theme.body.split(',')[0].replace(/'/g, '')} text</span>
            </div>
            <ThemePreview form={form} />
            <Toggle label="Use my own accent colour instead of the theme's" checked={form.theme.customColors} onChange={setNested('theme', 'customColors')} />
            {form.theme.customColors && (
              <FormGrid>
                <Field label="Accent colour" hint="Buttons, highlights">
                  <div className="row">
                    <input type="color" value={form.theme.primaryColor} onChange={text(setNested('theme', 'primaryColor'))} />
                    <input value={form.theme.primaryColor} onChange={text(setNested('theme', 'primaryColor'))} />
                  </div>
                </Field>
                <Field label="Accent colour (dark)" hint="Button hover, prices, links">
                  <div className="row">
                    <input type="color" value={form.theme.primaryDark} onChange={text(setNested('theme', 'primaryDark'))} />
                    <input value={form.theme.primaryDark} onChange={text(setNested('theme', 'primaryDark'))} />
                  </div>
                </Field>
              </FormGrid>
            )}
          </FormSection>

          <FormSection title="Branding">
            <FormGrid>
              <Field label="Store name"><input value={form.siteName} onChange={text(set('siteName'))} /></Field>
              <Field label="Announcement bar" hint="Shown above the navbar. Leave empty to hide.">
                <input value={form.announcement} onChange={text(set('announcement'))} placeholder="e.g. Diwali sale: 10% off" />
              </Field>
              <Field label="Logo" span={2} as="div" hint="Shown in the navbar at 36px tall. A transparent PNG or SVG works best.">
                <ImageSourceInput value={form.logoMedia} onChange={set('logoMedia')} />
              </Field>
            </FormGrid>
          </FormSection>

          <FormSection title="Home page banner">
            <FormGrid>
              <Field label="Heading" span={2}><input value={form.hero.title} onChange={text(setNested('hero', 'title'))} /></Field>
              <Field label="Sub-heading" span={2}><input value={form.hero.subtitle} onChange={text(setNested('hero', 'subtitle'))} /></Field>
              <Field label="Button text"><input value={form.hero.ctaText} onChange={text(setNested('hero', 'ctaText'))} /></Field>
              <Field label="Button link" hint="e.g. /shop/jewellery"><input value={form.hero.ctaLink} onChange={text(setNested('hero', 'ctaLink'))} /></Field>
              <Field label="Background image" span={2} as="div" hint="Wide images work best (at least 1600×600). Leave empty to use the theme's gradient.">
                <ImageSourceInput value={form.hero.imageMedia} onChange={setNested('hero', 'imageMedia')} wide />
              </Field>
            </FormGrid>
          </FormSection>
        </div>

        <div className="stack">
          <FormSection title="Checkout">
            <FormGrid>
              <Field label="GST (%)"><input type="number" min="0" step="0.1" value={form.gstRate} onChange={text(set('gstRate'))} /></Field>
              <Field label="Shipping fee (₹)"><input type="number" min="0" value={form.shippingFee} onChange={text(set('shippingFee'))} /></Field>
              <Field label="Free shipping above (₹)" span={2}><input type="number" min="0" value={form.freeShippingThreshold} onChange={text(set('freeShippingThreshold'))} /></Field>
            </FormGrid>
            <p className="field-label">Payment methods</p>
            <div className="stack-sm">
              <Toggle label="Credit / Debit card" checked={form.paymentMethods.card} onChange={setNested('paymentMethods', 'card')} />
              <Toggle label="UPI" checked={form.paymentMethods.upi} onChange={setNested('paymentMethods', 'upi')} />
              <Toggle label="Cash on delivery" checked={form.paymentMethods.cod} onChange={setNested('paymentMethods', 'cod')} />
            </div>
          </FormSection>

          <FormSection title="Contact & footer">
            <FormGrid>
              <Field label="Email"><input value={form.contact.email} onChange={text(setNested('contact', 'email'))} /></Field>
              <Field label="Phone"><input value={form.contact.phone} onChange={text(setNested('contact', 'phone'))} /></Field>
              <Field label="WhatsApp number" hint="With country code, e.g. 919876543210"><input value={form.contact.whatsapp} onChange={text(setNested('contact', 'whatsapp'))} /></Field>
              <Field label="Footer text"><input value={form.footerText} onChange={text(set('footerText'))} /></Field>
              <Field label="Address" span={2}><textarea rows={2} value={form.contact.address} onChange={text(setNested('contact', 'address'))} /></Field>
              <Field label="Instagram URL"><input value={form.social.instagram} onChange={text(setNested('social', 'instagram'))} /></Field>
              <Field label="Facebook URL"><input value={form.social.facebook} onChange={text(setNested('social', 'facebook'))} /></Field>
              <Field label="YouTube channel URL" span={2}><input value={form.social.youtube} onChange={text(setNested('social', 'youtube'))} /></Field>
            </FormGrid>
          </FormSection>
        </div>
      </div>
    </form>
  );
}

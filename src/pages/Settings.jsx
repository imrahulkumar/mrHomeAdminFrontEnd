import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ErrorState, Loader, PageHeader } from '../components/ui/Common';
import { Field, FormGrid, FormSection, Toggle } from '../components/ui/Form';
import { ImageSourceInput, toMedia } from '../components/ui/ImageInput';
import { useToast } from '../context/ToastContext';
import { FONTS, getFont, loadFonts } from '../utils/fonts';
import { THEMES, getTheme } from '../utils/themes';

// Mirrors the defaults in the backend's Setting model, for settings saved before these options existed.
const DEFAULT_SECTIONS = [
  { id: 'hero', enabled: true, title: '' },
  { id: 'categories', enabled: true, title: 'Shop by category' },
  { id: 'featured', enabled: true, title: 'Featured' },
  { id: 'videos', enabled: true, title: 'Watch our collection' },
];
const SECTION_LABELS = { hero: 'Banner', categories: 'Categories', featured: 'Featured products', videos: 'Videos' };
const DEFAULTS = {
  appearance: { headingFont: 'theme', bodyFont: 'theme', fontSize: 'medium', buttonShape: 'theme', cardStyle: 'theme', productColumns: 0 },
  header: { style: 'classic', sticky: true, menuStyle: 'underline', menuAlign: 'left', menuUppercase: false, showCategoryIcons: true },
  animation: { pageTransition: 'fade', scrollReveal: true, cardHover: 'lift', speed: 'normal' },
};

// Fill in image sources and layout options for settings saved before they existed.
const normalize = (s) => ({
  ...s,
  logoMedia: toMedia(s.logoMedia, s.logo),
  hero: { align: 'left', height: 'medium', ...s.hero, imageMedia: toMedia(s.hero?.imageMedia, s.hero?.image) },
  theme: { preset: 'classic', customColors: true, ...s.theme },
  homeSections: s.homeSections?.length ? s.homeSections : DEFAULT_SECTIONS,
  appearance: { ...DEFAULTS.appearance, ...s.appearance },
  header: { ...DEFAULTS.header, ...s.header },
  animation: { ...DEFAULTS.animation, ...s.animation },
});

const shownImage = (media) => media?.[media.source] ?? '';

const BUTTON_RADIUS = { square: 0, rounded: 10, pill: 999 };
const PREVIEW_MENU = ['Home', 'Jewellery', 'Décor'];
const fontOptions = [['theme', 'Theme default'], ...FONTS.map((f) => [f.id, f.name])];

/** A <select> over [value, label] pairs. */
function Choice({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}

/** A miniature storefront rendered with the chosen theme, logo, banner, fonts, header and card styles. */
function ThemePreview({ form }) {
  const t = getTheme(form.theme.preset);
  const { appearance: a, header: h } = form;
  const accent = form.theme.customColors ? form.theme.primaryColor : t.accent;
  const accentDark = form.theme.customColors ? form.theme.primaryDark : t.accentDark;
  const onAccent = t.onAccent ?? '#fff';
  const logo = shownImage(form.logoMedia);
  const heroImage = shownImage(form.hero.imageMedia);
  const heading = getFont(a.headingFont)?.family ?? t.heading;
  const body = getFont(a.bodyFont)?.family ?? t.body;
  const btn = { background: accent, color: onAccent, borderRadius: BUTTON_RADIUS[a.buttonShape] ?? t.btnRadius };
  const card = {
    theme: { background: t.surface, borderColor: t.border },
    bordered: { background: t.surface, borderColor: t.border },
    shadow: { background: t.surface, borderColor: 'transparent', boxShadow: '0 4px 14px rgba(0,0,0,.12)' },
    flat: { background: t.border, borderColor: 'transparent' },
  }[a.cardStyle];

  const menuItem = (name, i) => {
    const active = i === 0;
    const style = {
      underline: { borderBottom: `2px solid ${active ? accent : 'transparent'}`, color: active ? accentDark : t.ink },
      plain: { color: active ? accentDark : t.ink },
      pills: { borderRadius: 999, background: active ? accent : 'transparent', color: active ? onAccent : t.ink },
      boxed: { border: `1px solid ${active ? accent : t.border}`, borderRadius: btn.borderRadius, color: active ? accentDark : t.ink },
    }[h.menuStyle];
    return <span key={name} className="tp-menu-item" style={style}>{h.menuUppercase ? name.toUpperCase() : name}</span>;
  };
  const menu = <div className={`tp-menu ${h.menuAlign === 'center' ? 'center' : ''}`}>{PREVIEW_MENU.map(menuItem)}</div>;
  const sections = form.homeSections.filter((s) => s.enabled).map((s) => s.id);

  const blocks = {
    hero: (
      <div
        key="hero"
        className={`tp-hero tp-hero-${form.hero.height} ${form.hero.align === 'center' ? 'center' : ''}`}
        style={{
          borderRadius: t.radius,
          background: heroImage ? `linear-gradient(90deg, rgba(20,15,10,.75), rgba(20,15,10,.2)), url(${heroImage}) center / cover` : t.hero,
        }}
      >
        <strong style={{ fontFamily: heading }}>{form.hero.title}</strong>
        <span className="tp-btn" style={btn}>{form.hero.ctaText || 'Shop now'}</span>
      </div>
    ),
    featured: (
      <div key="featured" className={`tp-cards tp-hover-${form.animation.cardHover}`}>
        {['Gold Ring', 'Brass Vase'].map((name) => (
          <div key={name} className="tp-card" style={{ ...card, borderRadius: t.radius, '--tp-accent': accent }}>
            <div className="tp-img" style={{ background: a.cardStyle === 'flat' ? t.surface : t.border }} />
            <span>{name}</span>
            <span style={{ color: accentDark, fontWeight: 700 }}>₹12,999</span>
          </div>
        ))}
      </div>
    ),
    categories: (
      <div key="categories" className="tp-chips">
        {['💍 Rings', '📿 Necklaces', '🏺 Vases'].map((c) => (
          <span key={c} style={{ ...card, borderRadius: t.radius, color: t.ink }}>{c}</span>
        ))}
      </div>
    ),
    videos: <div key="videos" className="tp-video" style={{ borderRadius: t.radius }}>▶</div>,
  };

  return (
    <div className="theme-preview" style={{ background: t.bg, color: t.ink, fontFamily: body, borderColor: t.border }}>
      {form.announcement && <div className="tp-announce" style={{ background: t.announce[0], color: t.announce[1] }}>{form.announcement}</div>}
      <div className={`tp-nav tp-nav-${h.style}`} style={{ background: t.surface, borderColor: t.border }}>
        <span className="tp-brand" style={{ fontFamily: heading }}>
          {logo ? <img src={logo} alt="" /> : <span style={{ color: accent }}>◆</span>}
          {form.siteName}
        </span>
        {h.style === 'compact' && menu}
        <span className="tp-cart" style={{ color: t.muted }}>Cart</span>
      </div>
      {h.style !== 'compact' && <div className="tp-menu-bar" style={{ borderColor: t.border }}>{menu}</div>}
      <div className="tp-body">{sections.map((id) => blocks[id])}</div>
    </div>
  );
}

/** Reorder, show/hide and rename the home page blocks. */
function HomeSectionsEditor({ sections, onChange }) {
  const update = (i, patch) => onChange(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i, by) => {
    const next = [...sections];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  return (
    <ol className="section-order">
      {sections.map((s, i) => (
        <li key={s.id} className={s.enabled ? '' : 'is-hidden'}>
          <span className="section-order-moves">
            <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[s.id]} up`}>↑</button>
            <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label={`Move ${SECTION_LABELS[s.id]} down`}>↓</button>
          </span>
          <strong>{SECTION_LABELS[s.id]}</strong>
          {s.id === 'hero' ? (
            <span className="muted small">Edit below</span>
          ) : (
            <input value={s.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Section heading (optional)" aria-label={`${SECTION_LABELS[s.id]} heading`} />
          )}
          <Toggle label="Show" checked={s.enabled} onChange={(enabled) => update(i, { enabled })} />
        </li>
      ))}
    </ol>
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

  // Load the picked fonts so the preview can show them.
  const headingFont = form?.appearance.headingFont;
  const bodyFont = form?.appearance.bodyFont;
  useEffect(() => loadFonts([headingFont, bodyFont]), [headingFont, bodyFont]);

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

          <FormSection title="Fonts, buttons & cards" description="Override parts of the theme. “Theme default” keeps the theme's own choice.">
            <FormGrid>
              <Field label="Heading font">
                <Choice value={form.appearance.headingFont} onChange={setNested('appearance', 'headingFont')} options={fontOptions} />
              </Field>
              <Field label="Body font">
                <Choice value={form.appearance.bodyFont} onChange={setNested('appearance', 'bodyFont')} options={fontOptions} />
              </Field>
              <Field label="Text size">
                <Choice value={form.appearance.fontSize} onChange={setNested('appearance', 'fontSize')} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} />
              </Field>
              <Field label="Button shape">
                <Choice
                  value={form.appearance.buttonShape}
                  onChange={setNested('appearance', 'buttonShape')}
                  options={[['theme', 'Theme default'], ['square', 'Square'], ['rounded', 'Rounded'], ['pill', 'Pill']]}
                />
              </Field>
              <Field label="Card style">
                <Choice
                  value={form.appearance.cardStyle}
                  onChange={setNested('appearance', 'cardStyle')}
                  options={[['theme', 'Theme default'], ['bordered', 'Bordered'], ['shadow', 'Shadow'], ['flat', 'Flat']]}
                />
              </Field>
              <Field label="Products per row" hint="On desktop. Phones always show 2.">
                <Choice
                  value={String(form.appearance.productColumns)}
                  onChange={(v) => setNested('appearance', 'productColumns')(Number(v))}
                  options={[['0', 'Automatic'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']]}
                />
              </Field>
            </FormGrid>
          </FormSection>

          <FormSection title="Header & menu">
            <FormGrid>
              <Field label="Header layout">
                <Choice
                  value={form.header.style}
                  onChange={setNested('header', 'style')}
                  options={[['classic', 'Classic — logo left, menu below'], ['centered', 'Centered — logo in the middle'], ['compact', 'Compact — menu beside the logo']]}
                />
              </Field>
              <Field label="Menu style">
                <Choice
                  value={form.header.menuStyle}
                  onChange={setNested('header', 'menuStyle')}
                  options={[['underline', 'Underline'], ['pills', 'Pills'], ['boxed', 'Boxed'], ['plain', 'Plain text']]}
                />
              </Field>
              <Field label="Menu alignment">
                <Choice value={form.header.menuAlign} onChange={setNested('header', 'menuAlign')} options={[['left', 'Left'], ['center', 'Centre']]} />
              </Field>
            </FormGrid>
            <div className="stack-sm">
              <Toggle label="Keep the header visible while scrolling" checked={form.header.sticky} onChange={setNested('header', 'sticky')} />
              <Toggle label="Uppercase menu items" checked={form.header.menuUppercase} onChange={setNested('header', 'menuUppercase')} />
              <Toggle label="Show category icons in the menu" checked={form.header.showCategoryIcons} onChange={setNested('header', 'showCategoryIcons')} />
            </div>
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

          <FormSection title="Home page sections" description="Reorder with the arrows, hide sections you don't need, and rename their headings.">
            <HomeSectionsEditor sections={form.homeSections} onChange={set('homeSections')} />
          </FormSection>

          <FormSection title="Home page banner">
            <FormGrid>
              <Field label="Text alignment">
                <Choice value={form.hero.align} onChange={setNested('hero', 'align')} options={[['left', 'Left'], ['center', 'Centre']]} />
              </Field>
              <Field label="Height">
                <Choice value={form.hero.height} onChange={setNested('hero', 'height')} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} />
              </Field>
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
          <FormSection title="Animations" description="Visitors who turn off motion in their device settings won't see these.">
            <FormGrid>
              <Field label="Page transition">
                <Choice
                  value={form.animation.pageTransition}
                  onChange={setNested('animation', 'pageTransition')}
                  options={[['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide up'], ['zoom', 'Zoom']]}
                />
              </Field>
              <Field label="Product card hover" hint="Hover the cards in the preview">
                <Choice
                  value={form.animation.cardHover}
                  onChange={setNested('animation', 'cardHover')}
                  options={[['none', 'None'], ['lift', 'Lift'], ['zoom', 'Zoom image'], ['glow', 'Glow']]}
                />
              </Field>
              <Field label="Speed" span={2}>
                <Choice value={form.animation.speed} onChange={setNested('animation', 'speed')} options={[['fast', 'Fast'], ['normal', 'Normal'], ['slow', 'Slow']]} />
              </Field>
            </FormGrid>
            <Toggle label="Fade in home page sections on scroll" checked={form.animation.scrollReveal} onChange={setNested('animation', 'scrollReveal')} />
          </FormSection>

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

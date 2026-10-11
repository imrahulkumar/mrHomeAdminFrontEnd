import { useEffect, useRef, useState } from 'react';
import { getFont } from '../../utils/fonts';
import { getTheme } from '../../utils/themes';

/*
 * A scrollable miniature of the storefront home page that follows every unsaved change on the Settings page.
 * It mirrors the store's index.css rules with sp-* classes; when a store style changes, update it here too.
 */

const shownImage = (media) => media?.[media.source] ?? '';

const BUTTON_RADIUS = { square: 0, rounded: 10, pill: 999 };
const FONT_SIZE = { small: 11, medium: 12, large: 13.5 };
const SPEED = { fast: ['0.25s', '0.1s'], normal: ['0.45s', '0.18s'], slow: ['0.8s', '0.3s'] };

const MENU = [
  { name: 'Jewellery', icon: '💍' },
  { name: 'Home Décor', icon: '🏺' },
];
const CATEGORIES = [
  { name: 'Jewellery', icon: '💍', tagline: 'Gold, diamond & silver', subs: ['Rings', 'Necklaces', 'Earrings'] },
  { name: 'Home Décor', icon: '🏺', tagline: 'Handcrafted for your home', subs: ['Vases', 'Idols', 'Lamps'] },
];
const PRODUCTS = [
  ['Solitaire Ring', '18K Gold', '💍', 45999, 52000],
  ['Temple Necklace', '22K Gold', '📿', 128500, 0],
  ['Pearl Studs', 'Silver', '✨', 3499, 4200],
  ['Brass Vase', 'Brass', '🏺', 2799, 0],
  ['Ganesha Idol', 'Marble', '🪔', 5499, 6100],
  ['Kada Bangle', '22K Gold', '⭕', 61999, 0],
  ['Tennis Bracelet', 'White Gold', '💎', 89999, 0],
  ['Diya Set', 'Brass', '🕯️', 1299, 1599],
].map(([name, material, icon, price, mrp]) => ({ name, material, icon, price, mrp }));

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

/** Fades in once it scrolls into view inside the preview, like the store's Reveal component. */
function Reveal({ enabled, rootRef, children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return setShown(true);
    setShown(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { root: rootRef.current, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, rootRef]);

  return <div ref={ref} className={enabled ? `sp-reveal ${shown ? 'is-shown' : ''}` : ''}>{children}</div>;
}

export default function StorePreview({ form }) {
  const [device, setDevice] = useState('desktop');
  const [replay, setReplay] = useState(0);
  const scrollerRef = useRef(null);
  const mobile = device === 'mobile';

  const t = getTheme(form.theme.preset);
  const { appearance: a, header: h, animation: anim, hero } = form;
  const accent = form.theme.customColors ? form.theme.primaryColor : t.accent;
  const accentDark = form.theme.customColors ? form.theme.primaryDark : t.accentDark;
  const onAccent = t.onAccent ?? '#fff';
  const logo = shownImage(form.logoMedia);
  const heroImage = shownImage(hero.imageMedia);
  const headingFont = getFont(a.headingFont)?.family ?? t.heading;
  const [animSlow, animFast] = SPEED[anim.speed] ?? SPEED.normal;
  const btnRadius = BUTTON_RADIUS[a.buttonShape] ?? t.btnRadius;
  const cols = mobile ? 2 : a.productColumns || 4;

  const card = {
    theme: { background: t.surface, borderColor: t.border },
    bordered: { background: t.surface, borderColor: t.border },
    shadow: { background: t.surface, borderColor: 'transparent', boxShadow: '0 4px 14px rgba(0,0,0,.12)' },
    flat: { background: t.border, borderColor: 'transparent' },
  }[a.cardStyle] ?? {};
  const btn = { background: accent, color: onAccent, borderRadius: btnRadius };
  const heading = { fontFamily: headingFont };

  // Re-run the page transition and scroll reveals whenever their settings change or "Replay" is pressed.
  const animKey = `${replay}-${anim.pageTransition}-${anim.speed}-${anim.scrollReveal}-${device}`;
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [animKey]);

  const menuItem = (name, icon, active) => {
    const style = {
      underline: { borderBottom: `2px solid ${active ? accent : 'transparent'}`, color: active ? accentDark : t.ink },
      plain: { color: active ? accentDark : t.ink, fontWeight: active ? 600 : 400 },
      pills: { borderRadius: 999, background: active ? accent : 'transparent', color: active ? onAccent : t.ink },
      boxed: { border: `1px solid ${active ? accent : t.border}`, borderRadius: btnRadius, color: active ? accentDark : t.ink, background: t.surface },
    }[h.menuStyle];
    return (
      <span key={name} className={`sp-menu-item ${h.menuUppercase ? 'upper' : ''}`} style={style}>
        {h.showCategoryIcons && icon && `${icon} `}{name}
      </span>
    );
  };
  const menu = (
    <div className={`sp-menu ${h.menuAlign === 'center' ? 'center' : ''}`}>
      {menuItem('Home', '', true)}
      {MENU.map((m) => menuItem(m.name, m.icon, false))}
    </div>
  );

  const sectionTitle = (title) => title && <h3 className="sp-section-title" style={heading}>{title}</h3>;

  const blocks = {
    hero: () => (
      <div
        className={`sp-hero sp-hero-${hero.height} ${hero.align === 'center' ? 'center' : ''}`}
        style={{
          borderRadius: t.radius,
          background: heroImage ? `linear-gradient(90deg, rgba(20,15,10,.75), rgba(20,15,10,.2)), url(${heroImage}) center / cover` : t.hero,
        }}
      >
        <strong style={heading}>{hero.title}</strong>
        {hero.subtitle && <span className="sp-hero-sub">{hero.subtitle}</span>}
        {hero.ctaText && <span className="sp-btn" style={btn}>{hero.ctaText}</span>}
      </div>
    ),
    categories: (title) => (
      <>
        {sectionTitle(title)}
        <div className="sp-dept-grid" style={{ gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
          {CATEGORIES.map((c) => (
            <div key={c.name} className="sp-dept" style={{ ...card, borderRadius: t.radius }}>
              <div className="sp-dept-title">
                <span className="sp-dept-icon" style={{ background: t.border }}>{c.icon}</span>
                <span>
                  <strong style={heading}>{c.name}</strong>
                  <small style={{ color: t.muted }}>{c.tagline}</small>
                </span>
              </div>
              <div className="sp-chips">
                {c.subs.map((s) => <span key={s} style={{ borderColor: t.border, background: t.bg }}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    featured: (title) => (
      <>
        {sectionTitle(title)}
        <div className={`sp-products sp-hover-${anim.cardHover}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {PRODUCTS.slice(0, Math.min(8, cols * 2)).map((p) => (
            <div key={p.name} className="sp-product" style={{ ...card, borderRadius: t.radius, '--sp-accent': accent }}>
              <div className="sp-product-media">
                <div className="sp-product-img" style={{ background: a.cardStyle === 'flat' ? t.surface : t.border }}>{p.icon}</div>
                {p.mrp > 0 && <span className="sp-tag">-{Math.round(((p.mrp - p.price) / p.mrp) * 100)}%</span>}
              </div>
              <div className="sp-product-body">
                <small style={{ color: t.muted }}>{p.material}</small>
                <span className="sp-product-name">{p.name}</span>
                <span>
                  <b style={{ color: accentDark }}>{rupees(p.price)}</b>
                  {p.mrp > 0 && <s style={{ color: t.muted }}> {rupees(p.mrp)}</s>}
                </span>
                <span className="sp-btn sp-btn-block" style={btn}>Add to cart</span>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    videos: (title) => (
      <>
        {sectionTitle(title)}
        <div className="sp-videos" style={{ gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
          {['Bridal collection', 'Festive décor'].map((v) => (
            <div key={v}>
              <div className="sp-video" style={{ borderRadius: t.radius }}><span>▶</span></div>
              <small>{v}</small>
            </div>
          ))}
        </div>
      </>
    ),
  };

  const { contact = {}, social = {} } = form;
  const socials = [['Instagram', social.instagram], ['Facebook', social.facebook], ['YouTube', social.youtube]].filter(([, url]) => url);

  return (
    <div className="store-preview">
      <div className="store-preview-bar">
        <strong>Live preview</strong>
        <div className="row">
          <div className="segmented" role="group" aria-label="Preview device">
            {['desktop', 'mobile'].map((d) => (
              <button key={d} type="button" className={device === d ? 'active' : ''} onClick={() => setDevice(d)}>
                {d === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-sm" onClick={() => setReplay((n) => n + 1)} title="Replay page transition and scroll animations">
            ↻ Replay
          </button>
        </div>
      </div>

      <div className={`sp-frame ${mobile ? 'is-mobile' : ''}`} ref={scrollerRef}>
        <div
          className="sp-page"
          style={{
            background: t.bg,
            color: t.ink,
            fontFamily: getFont(a.bodyFont)?.family ?? t.body,
            fontSize: FONT_SIZE[a.fontSize] ?? 12,
            '--sp-anim': animSlow,
            '--sp-anim-fast': animFast,
          }}
        >
          <div className={`sp-header ${h.sticky ? 'is-sticky' : ''}`}>
            {form.announcement && <div className="sp-announce" style={{ background: t.announce[0], color: t.announce[1] }}>{form.announcement}</div>}
            <div className={`sp-nav sp-nav-${h.style} ${mobile ? 'is-mobile' : ''}`} style={{ background: t.surface, borderColor: t.border }}>
              <span className="sp-brand" style={heading}>
                {logo ? <img src={logo} alt="" /> : <span style={{ color: accent }}>◆</span>}
                {form.siteName}
              </span>
              {h.style === 'compact' && <div className="sp-nav-menu">{menu}</div>}
              <span className="sp-actions">
                {!mobile && <span style={{ color: t.muted }}>Login</span>}
                <span className="sp-btn" style={btn}>Sign up</span>
                <span>🛒</span>
              </span>
            </div>
            {h.style !== 'compact' && <div className="sp-menu-bar" style={{ background: t.surface, borderColor: t.border }}>{menu}</div>}
          </div>

          <div key={animKey} className={`sp-main sp-enter-${anim.pageTransition}`}>
            {form.homeSections
              .filter((s) => s.enabled)
              .map((s) => (
                <Reveal key={s.id} enabled={anim.scrollReveal} rootRef={scrollerRef}>
                  <section className="sp-section">{blocks[s.id]?.(s.title)}</section>
                </Reveal>
              ))}
            {!form.homeSections.some((s) => s.enabled) && <p className="sp-empty" style={{ color: t.muted }}>All home page sections are hidden.</p>}
          </div>

          <footer className="sp-footer" style={{ borderColor: t.border, color: t.muted }}>
            <div className={`sp-footer-cols ${mobile ? 'is-mobile' : ''}`}>
              <div>
                <strong style={{ ...heading, color: t.ink }}>{form.siteName}</strong>
                {contact.address && <p>{contact.address}</p>}
              </div>
              <div>
                <b style={{ color: t.ink }}>Shop</b>
                {CATEGORIES.map((c) => <p key={c.name} style={{ color: accentDark }}>{c.name}</p>)}
              </div>
              {(contact.email || contact.phone || contact.whatsapp) && (
                <div>
                  <b style={{ color: t.ink }}>Contact</b>
                  {contact.phone && <p style={{ color: accentDark }}>📞 {contact.phone}</p>}
                  {contact.whatsapp && <p style={{ color: accentDark }}>💬 WhatsApp</p>}
                  {contact.email && <p style={{ color: accentDark }}>✉️ {contact.email}</p>}
                </div>
              )}
              {socials.length > 0 && (
                <div>
                  <b style={{ color: t.ink }}>Follow us</b>
                  {socials.map(([name]) => <p key={name} style={{ color: accentDark }}>{name}</p>)}
                </div>
              )}
            </div>
            <p className="sp-footer-bottom" style={{ borderColor: t.border }}>
              © {new Date().getFullYear()} {form.siteName}
              {form.footerText && ` · ${form.footerText}`}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

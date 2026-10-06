import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ErrorState, Loader, PageHeader } from '../components/ui/Common';
import { Field, FormGrid, FormSection, Toggle } from '../components/ui/Form';
import { ImageInput } from '../components/ui/ImageInput';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const notify = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(setForm).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!form) return <Loader />;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key) => (value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  const text = (setter) => (e) => setter(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      setForm(
        await api.put('/settings', {
          ...form,
          gstRate: Number(form.gstRate),
          shippingFee: Number(form.shippingFee),
          freeShippingThreshold: Number(form.freeShippingThreshold),
        }),
      );
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
          <FormSection title="Branding">
            <FormGrid>
              <Field label="Store name"><input value={form.siteName} onChange={text(set('siteName'))} /></Field>
              <Field label="Announcement bar" hint="Shown above the navbar. Leave empty to hide.">
                <input value={form.announcement} onChange={text(set('announcement'))} placeholder="e.g. Diwali sale: 10% off" />
              </Field>
              <Field label="Logo" span={2}><ImageInput value={form.logo} onChange={set('logo')} /></Field>
              <Field label="Primary colour">
                <div className="row">
                  <input type="color" value={form.theme.primaryColor} onChange={text(setNested('theme', 'primaryColor'))} />
                  <input value={form.theme.primaryColor} onChange={text(setNested('theme', 'primaryColor'))} />
                </div>
              </Field>
              <Field label="Primary colour (hover)">
                <div className="row">
                  <input type="color" value={form.theme.primaryDark} onChange={text(setNested('theme', 'primaryDark'))} />
                  <input value={form.theme.primaryDark} onChange={text(setNested('theme', 'primaryDark'))} />
                </div>
              </Field>
            </FormGrid>
          </FormSection>

          <FormSection title="Home page banner">
            <FormGrid>
              <Field label="Heading" span={2}><input value={form.hero.title} onChange={text(setNested('hero', 'title'))} /></Field>
              <Field label="Sub-heading" span={2}><input value={form.hero.subtitle} onChange={text(setNested('hero', 'subtitle'))} /></Field>
              <Field label="Button text"><input value={form.hero.ctaText} onChange={text(setNested('hero', 'ctaText'))} /></Field>
              <Field label="Button link" hint="e.g. /shop/jewellery"><input value={form.hero.ctaLink} onChange={text(setNested('hero', 'ctaLink'))} /></Field>
              <Field label="Background image" span={2}><ImageInput value={form.hero.image} onChange={setNested('hero', 'image')} /></Field>
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

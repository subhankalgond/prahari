import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-content mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
              <Sprout className="w-5 h-5 text-white" aria-hidden />
            </span>
            <span className="font-bold text-lg text-primary-900">Prahari</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-primary-800 hover:underline">
            Back to home
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-600">Last updated: September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-600">
          <section>
            <h2 className="text-lg font-semibold text-ink-900">1. Data we collect</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Account details: name, mobile number, optional email, and your village, taluk, district and state.</li>
              <li>Crop information you enter: crop name, variety, field, area, dates, soil and irrigation type.</li>
              <li>Crop photos you upload for analysis and the resulting scan records.</li>
              <li>Weather lookups for your location to compute risk signals.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">2. How we use it</h2>
            <p className="mt-2">
              Your data is used only to operate the service: generating AI-assisted scan results, computing risk
              alerts, maintaining your crop history and showing relevant advisories. We do not sell your data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">3. Passwords and security</h2>
            <p className="mt-2">
              Passwords are stored only as salted hashes. Access to your crops, scans, alerts and notifications is
              restricted to your account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">4. Uploaded images</h2>
            <p className="mt-2">
              Photos are stored with random server-generated filenames and are served only to authenticated sessions.
              You can request deletion by removing the crop or contacting support.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">5. Retention</h2>
            <p className="mt-2">
              Scan history is retained while your account is active so you can track crop health over time. Deleting
              a crop removes its scans from your account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">6. Your choices</h2>
            <p className="mt-2">
              You can edit your profile and language at any time, and sign out on any device. Contact support to
              request full account deletion.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

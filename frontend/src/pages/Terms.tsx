import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export default function Terms() {
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
        <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-ink-600">Last updated: September 2026</p>

        <div className="prose-kc mt-8 space-y-6 text-sm leading-relaxed text-ink-600">
          <section>
            <h2 className="text-lg font-semibold text-ink-900">1. About the service</h2>
            <p className="mt-2">
              Prahari is a crop health monitoring platform that provides AI-assisted image analysis, weather-based
              risk signals and a disease and pest knowledge library. The service is intended to support early
              screening and awareness. It is not a substitute for professional agricultural advice.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">2. Nature of AI-assisted results</h2>
            <p className="mt-2">
              All scan results are labelled AI-assisted. Confidence values express model uncertainty and are never a
              guarantee of correctness. Conditions may be misidentified, especially from blurry photos, unusual
              symptoms or atypical lighting. Always confirm with a qualified agricultural expert before purchasing or
              applying any treatment. Where chemical control is discussed in the library, follow the product label
              and local regulations exactly.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">3. Risk alerts</h2>
            <p className="mt-2">
              Risk alerts are generated from transparent rules combining weather, crop stage and location factors.
              They are screening signals, not predictions of disease occurrence. Field verification remains your
              responsibility.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">4. Accounts</h2>
            <p className="mt-2">
              You are responsible for the accuracy of the information you provide and for keeping your password
              secure. Accounts found misusing the service may be suspended by administrators.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">5. Uploaded images</h2>
            <p className="mt-2">
              Crop photos you upload are stored to provide analysis and history features. Do not upload images
              containing people or information you do not have the right to share.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">6. Availability</h2>
            <p className="mt-2">
              Weather and AI analysis depend on external services. Some features may be unavailable temporarily; the
              app will clearly state when this happens.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">7. Contact</h2>
            <p className="mt-2">For questions about these terms, contact support through the Help section of the app.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

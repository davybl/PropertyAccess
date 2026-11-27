import { AppShell } from "@/components/app-shell";

export default function PrivacyPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl space-y-6 pb-10">
        <header className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-brand">
            PropertyAccess Kenya
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-ink-muted">Effective 28 November 2026</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            This policy explains how PropertyAccess handles personal data when
            you use propertyaccess.ke. We process personal data in line with
            Kenya&apos;s Data Protection Act, 2019 and applicable regulations.
          </p>
        </header>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Data we collect</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            We collect account details such as your name, email address, and
            phone number; property and listing information you submit; and
            service activity such as saved listings, contact reveals, and
            viewing-status updates. Manager verification may include a KRA PIN,
            National ID image, and proof of ownership or caretaker authority.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Phone numbers and M-Pesa</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Phone numbers are used for account and caretaker contact features.
            When you initiate an M-Pesa STK Push, we process the number you
            submit and payment metadata returned by the payment provider, such
            as the transaction reference, amount, status, and receipt number.
            We do not receive or store your M-Pesa PIN. Payment processing is
            handled by Safaricom and the configured payment services.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">KYC document security</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            KYC files are stored in a private document bucket and are not
            published as listing media. Access is restricted to authorized
            verification workflows; administrators use time-limited signed
            links to review submissions. Do not upload documents that are not
            requested for manager verification.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">How we use and share data</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            We use data to operate accounts, provide contact unlocks, process
            payments, verify managers, moderate listings, send service
            notifications, prevent abuse, and meet legal obligations. We share
            necessary data with service providers that support hosting,
            authentication, storage, analytics, or payment processing. Google
            Maps receives location-search information when you choose to open
            a listing in Maps. We do not sell personal data.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Retention and your rights</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            We retain personal data only as long as needed for the purposes
            described here, account operations, dispute handling, and lawful
            recordkeeping. Subject to applicable law, you may request access to
            or correction or deletion of your personal data, object to or
            request restriction of processing, and withdraw consent where
            processing relies on consent. Contact the PropertyAccess team
            through the channels shown on the website to make a privacy
            request.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Cookies, device sessions, and updates</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Essential cookies and device identifiers support sign-in, session
            security, and service preferences. We may update this policy when
            our practices or legal obligations change. The latest version and
            effective date will appear on this page.
          </p>
        </section>
      </article>
    </AppShell>
  );
}

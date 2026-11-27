import { AppShell } from "@/components/app-shell";

export default function TermsPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl space-y-6 pb-10">
        <header className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-brand">
            PropertyAccess Kenya
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-ink-muted">Effective 28 November 2026</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            These terms govern your use of propertyaccess.ke, a marketplace that
            helps people connect directly with property owners and caretakers in
            Kenya. By using the service, you agree to these terms.
          </p>
        </header>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Direct-to-caretaker marketplace</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            PropertyAccess provides listing information and access to caretaker
            or owner contact details. PropertyAccess is not a real-estate agent
            and does not represent either party in a tenancy or sale. Users must
            confirm availability, authority to let or sell, property condition,
            prices, and any agreement directly with the relevant owner or
            caretaker before paying a deposit or making a commitment.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Zero-broker policy</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            We do not charge a broker or viewing commission. A pass fee pays for
            access to the platform&apos;s contact-unlock service only. Do not
            pay a viewing fee to a person claiming it is required by
            PropertyAccess. Inspect a property in person and independently
            verify the caretaker&apos;s or owner&apos;s authority before paying
            rent, a deposit, or a purchase price.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Passes and contact access</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            A KES 200 Category Pass is valid for seven days and permits up to
            seven unique contact reveals per day in its category. Passes are
            personal, non-transferable, and cannot be shared or resold. The
            Refund Policy explains the limited credit or replacement remedy for
            qualifying inaccurate listings.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Account and device security</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Keep your login details private. An account may have one active
            phone session at a time and may authorize no more than three
            devices within a rolling 30-day period. Signing in on another phone
            can end the previous active session. Do not create accounts to
            bypass these anti-sharing limits.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Acceptable use and availability</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            You must provide accurate account information and use contact
            details respectfully. You may not impersonate an owner or
            caretaker, scrape or redistribute contact information, submit
            fraudulent listings, or use the service unlawfully. We may
            investigate reports, restrict accounts, or pause listings to
            protect users. Listings and platform availability can change; we do
            not guarantee a property will remain available or that a user will
            enter into an agreement.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Changes and contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            We may update these terms as the service changes. The current
            version will be published on this page. For questions or concerns,
            contact the PropertyAccess team through the contact channels shown
            on the website.
          </p>
        </section>
      </article>
    </AppShell>
  );
}

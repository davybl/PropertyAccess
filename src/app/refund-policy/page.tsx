import { AppShell } from "@/components/app-shell";

export default function RefundPolicyPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl space-y-6 pb-10">
        <header className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-brand">
            PropertyAccess Kenya
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Refund Policy
          </h1>
          <p className="mt-2 text-xs text-ink-muted">Effective 28 November 2026</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            This policy covers the KES 200 7-Day Category Pass used to reveal
            caretaker contact details on propertyaccess.ke.
          </p>
        </header>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">What the pass includes</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Each pass is valid for seven days in the selected category and
            allows up to seven unique contact reveals per day. Passes are
            personal, non-transferable, and cannot be shared between accounts.
            Re-opening a contact already revealed by your account does not use
            another reveal.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">
            24-hour listing credit or replacement
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            If, within 24 hours of revealing a contact, you find that the
            listing is controlled by an unauthorized broker or the property is
            already rented or occupied, report it from the listing or your
            unlock history. Include accurate details that help us verify the
            issue. If our review confirms the report, we will restore an
            eligible reveal credit or provide a replacement reveal to the
            applicable pass.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">Review and exclusions</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Reports are reviewed by the moderation team and may require
            supporting information. This remedy applies only to verified
            unauthorized-broker or already-occupied listing reports submitted
            within the 24-hour window. It does not cover a change of plans,
            failure to reach a caretaker, personal preference, or a property
            that becomes unavailable after the report window. A pass is a
            digital service and unused time or reveals are not otherwise
            refundable under this policy.
          </p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-ink">How to request help</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Submit a listing report promptly, and use the dispute option in My
            Unlocks where available. We will review the report and update the
            status in your account. For questions, contact the PropertyAccess
            team through the channels shown on the website.
          </p>
        </section>
      </article>
    </AppShell>
  );
}

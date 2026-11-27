import Link from "next/link";

export function LegalLinks() {
  return (
    <nav
      aria-label="Legal policies"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-ink-muted"
    >
      <Link href="/terms" className="transition hover:text-emerald-brand">
        Terms
      </Link>
      <Link href="/privacy" className="transition hover:text-emerald-brand">
        Privacy
      </Link>
      <Link href="/refund-policy" className="transition hover:text-emerald-brand">
        Refund policy
      </Link>
    </nav>
  );
}

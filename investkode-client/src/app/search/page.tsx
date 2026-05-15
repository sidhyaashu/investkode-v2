import { InvestKodeShell } from "@/components/app-shell/investkode-shell";

export default function SearchPage() {
  return (
    <InvestKodeShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Search</h1>
        <p className="text-[var(--ik-ink-3)] max-w-md">
          This page is under construction. Soon you will be able to search for 4,000+ NSE & BSE listed companies.
        </p>
      </div>
    </InvestKodeShell>
  );
}

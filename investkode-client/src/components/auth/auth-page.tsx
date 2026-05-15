"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  ChatCenteredTextIcon,
  CheckIcon,
  CpuIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type AuthState = "initial" | "loading" | "success";

export function AuthPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [state, setState] = useState<AuthState>("initial");

  const isDark = theme === "dark";

  async function handleGoogleAuth() {
    setState("loading");

    /*
      Production option 1:
      Redirect to backend OAuth URL if you expose:
      window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/google/login`;

      Production option 2:
      Use Google Identity Services in frontend, get id_token,
      then POST to /api/v1/auth/google.

      For now this keeps your UI working and ready.
    */

    setTimeout(() => {
      setState("success");
    }, 800);
  }


//   async function submitGoogleToken(idToken: string) {
//     const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/google`,
//         {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         credentials: "include",
//         body: JSON.stringify({ id_token: idToken }),
//         }
//     );

//     if (!res.ok) {
//         throw new Error("Google login failed");
//     }

//     router.push("/watchlist");
//     }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-6 text-[var(--ik-ink)]">
      <div className="pointer-events-none fixed -left-28 top-16 -z-10 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(92,141,255,0.55),transparent_70%)] blur-[60px] opacity-55" />
      <div className="pointer-events-none fixed -right-20 -bottom-20 -z-10 size-[480px] rounded-full bg-[radial-gradient(circle,rgba(155,193,255,0.60),transparent_70%)] blur-[60px] opacity-55" />

      <section className="grid min-h-[620px] w-full max-w-[1080px] overflow-hidden rounded-[22px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0.45))] shadow-[var(--ik-glass-shadow)] backdrop-blur-2xl md:grid-cols-[1fr_1.05fr] dark:bg-[linear-gradient(180deg,rgba(22,22,25,0.88),rgba(15,15,18,0.82))]">
        <AuthPitchPanel />

        <section className="relative flex flex-col px-6 py-7 md:px-[42px] md:py-[30px]">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="grid size-[34px] place-items-center rounded-[9px] border border-[var(--ik-field-border)] bg-[var(--ik-field-bg)] text-[var(--ik-ink-2)] transition hover:text-[var(--ik-accent-deep)] dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-2">
            {state !== "success" ? (
              <div
                className={cn(
                  "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                  state === "loading" && "pointer-events-none"
                )}
              >
                <div className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--ik-ink-3)]">
                  <span className="size-2 animate-pulse rounded-full bg-[var(--ik-good)]" />
                  Welcome to InvestKaro
                </div>

                <h2 className="mt-4 font-sans text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-[var(--ik-ink)]">
                  Sign in or sign up —{" "}
                  <em className="not-italic text-[var(--ik-accent-deep)] dark:text-white">
                    same step.
                  </em>
                </h2>

                <p className="mt-3 font-sans text-sm leading-6 text-[var(--ik-ink-3)]">
                  Continue with Google. We'll create your account if it's your
                  first time, or take you to your watchlist if you've been here
                  before.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={state === "loading"}
                  className="relative mt-7 flex h-[50px] w-full items-center justify-between overflow-hidden rounded-[12px] border border-[var(--ik-field-border)] bg-white/80 px-4 font-sans text-[14px] font-semibold text-[var(--ik-ink)] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-10px_rgba(43,69,112,0.28)] transition hover:-translate-y-px hover:border-[var(--ik-accent-2)] hover:shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_24px_-12px_rgba(43,107,255,0.38)] disabled:cursor-not-allowed dark:bg-white/[0.06] dark:hover:border-white/20"
                >
                  <span className="flex items-center gap-3">
                    <GoogleLogo />
                    <span>{state === "loading" ? "Connecting..." : "Continue with Google"}</span>
                  </span>

                  {state === "loading" ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-[var(--ik-rule)] border-t-[var(--ik-accent-deep)]" />
                  ) : (
                    <span className="grid size-7 place-items-center rounded-lg bg-[var(--ik-accent-soft)] text-[var(--ik-accent-deep)] dark:text-white">
                      <ArrowRightIcon size={14} />
                    </span>
                  )}
                </button>

                <div className="mt-3 text-center font-sans text-[12.5px] leading-5 text-[var(--ik-ink-3)]">
                  No password to remember.{" "}
                  <b className="font-semibold text-[var(--ik-ink-2)]">
                    One tap, signed in.
                  </b>
                </div>

                <div className="mt-[22px] grid grid-cols-3 gap-2.5 max-[480px]:grid-cols-1">
                  <QuickStat label="Stocks tracked" value="4,000+" />
                  <QuickStat label="Concalls indexed" value="12,400+" />
                  <QuickStat label="Setup time" value="~ 5 sec" />
                </div>

                <div className="mt-[22px] flex items-start gap-3 rounded-[11px] border border-[var(--ik-accent-soft-2)] bg-[var(--ik-accent-soft)] px-3.5 py-3 text-xs leading-5 text-[var(--ik-ink-2)] dark:border-white/10 dark:bg-white/[0.04]">
                  <ShieldCheckIcon
                    size={15}
                    className="mt-0.5 shrink-0 text-[var(--ik-accent-deep)] dark:text-white"
                  />
                  <div>
                    <b className="font-semibold text-[var(--ik-ink)]">
                      Secure by default.
                    </b>{" "}
                    Google handles your credentials. We only see your name and
                    email — never your password.
                  </div>
                </div>

                <div className="mt-[18px] text-center font-mono text-[11px] leading-5 tracking-[0.02em] text-[var(--ik-ink-3)]">
                  By continuing you agree to our{" "}
                  <a href="#" className="underline decoration-[var(--ik-rule)] underline-offset-2 hover:text-[var(--ik-accent-deep)] dark:hover:text-white">
                    Terms
                  </a>{" "}
                  &{" "}
                  <a href="#" className="underline decoration-[var(--ik-rule)] underline-offset-2 hover:text-[var(--ik-accent-deep)] dark:hover:text-white">
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>
            ) : (
              <SuccessState onOpen={() => router.push("/watchlist")} />
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function AuthPitchPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[var(--ik-rule)] bg-[linear-gradient(165deg,rgba(255,255,255,0.40),rgba(220,233,255,0.30))] px-[38px] py-[34px] md:flex md:flex-col dark:bg-[linear-gradient(165deg,rgba(20,20,23,0.70),rgba(14,14,17,0.60))]">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(var(--ik-rule-2)_1px,transparent_1px),linear-gradient(90deg,var(--ik-rule-2)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(circle_at_70%_90%,black_10%,transparent_70%)]" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="grid size-[34px] place-items-center rounded-[9px] bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] text-base font-bold text-white shadow-[0_4px_12px_rgba(43,107,255,0.35),0_1px_0_rgba(255,255,255,0.4)_inset] dark:bg-[linear-gradient(135deg,#2A2A2E,#3A3A3F)]">
          i
        </div>
        <div className="font-sans text-lg font-bold tracking-[-0.02em] text-[var(--ik-ink)]">
          InvestKaro
        </div>
        <div className="border-l border-[var(--ik-rule)] pl-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ik-ink-3)]">
          India · Equity
        </div>
      </div>

      <h1 className="relative z-10 mt-[42px] max-w-[11ch] text-balance font-sans text-4xl font-bold leading-[1.12] tracking-[-0.025em] text-[var(--ik-ink)]">
        Research-grade insights,{" "}
        <em className="not-italic text-[var(--ik-accent-deep)] dark:text-white">
          retail-friendly
        </em>{" "}
        price.
      </h1>

      <p className="relative z-10 mt-4 max-w-[42ch] text-pretty font-sans text-sm leading-6 text-[var(--ik-ink-2)]">
        AI-led fundamental analysis for 4,000+ NSE & BSE listed companies.
        Concall transcripts, peer benchmarks, and a verdict you can act on.
      </p>

      <div className="relative z-10 mt-8 flex flex-col gap-[13px]">
        <PitchFeature
          icon={<ChartLineUpIcon size={14} />}
          title="AI verdicts on every stock"
          desc="Refreshed at 09:00 IST after every concall & quarterly filing."
        />
        <PitchFeature
          icon={<ChatCenteredTextIcon size={14} />}
          title="Concall transcripts, decoded"
          desc="Searchable, summarised, with management tone scoring."
        />
        <PitchFeature
          icon={<CpuIcon size={14} />}
          title="Peer-set you can trust"
          desc="Sector-mapped benchmarks: P/E, ROE, debt & growth."
        />
      </div>

      <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2.5 pt-7 font-mono text-[10.5px] tracking-[0.06em] text-[var(--ik-ink-3)]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ik-rule)] bg-white/55 px-2.5 py-1 dark:bg-white/[0.04]">
          <span className="size-1.5 rounded-full bg-[var(--ik-good)]" />
          Live market data
        </span>
        <span className="rounded-full border border-[var(--ik-rule)] bg-white/55 px-2.5 py-1 dark:bg-white/[0.04]">
          NSE · BSE · MCX
        </span>
        <span className="rounded-full border border-[var(--ik-rule)] bg-white/55 px-2.5 py-1 dark:bg-white/[0.04]">
          v 2.0
        </span>
      </div>
    </aside>
  );
}

function PitchFeature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="grid grid-cols-[30px_1fr] items-start gap-3">
      <div className="grid size-[30px] place-items-center rounded-lg border border-[var(--ik-accent-soft-2)] bg-[var(--ik-accent-soft)] text-[var(--ik-accent-deep)] dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
        {icon}
      </div>
      <div>
        <div className="font-sans text-[13px] font-semibold leading-[1.3] text-[var(--ik-ink)]">
          {title}
        </div>
        <div className="mt-0.5 font-sans text-xs leading-5 text-[var(--ik-ink-3)]">
          {desc}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[11px] border border-[var(--ik-field-border)] bg-[var(--ik-field-bg)] px-3 py-3">
      <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
        {label}
      </div>
      <div className="mt-1 font-sans text-[13px] font-semibold leading-tight text-[var(--ik-ink)]">
        <span className="font-mono text-[15px]">{value}</span>
      </div>
    </div>
  );
}

function SuccessState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex animate-in flex-col items-center gap-3.5 text-center fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="grid size-16 place-items-center rounded-[18px] border border-[rgba(16,163,127,0.25)] bg-[var(--ik-good-soft)] text-[var(--ik-good)] dark:border-[rgba(74,222,128,0.28)]">
        <CheckIcon size={30} weight="bold" />
      </div>

      <h3 className="m-0 font-sans text-[22px] font-bold tracking-[-0.02em] text-[var(--ik-ink)]">
        Welcome back!
      </h3>

      <div className="flex items-center gap-2.5 rounded-full border border-[var(--ik-field-border)] bg-[var(--ik-field-bg)] py-2 pl-2 pr-3.5 text-sm text-[var(--ik-ink-2)]">
        <div className="grid size-[30px] place-items-center rounded-full bg-[linear-gradient(135deg,#5C8DFF,#2B6BFF)] text-xs font-bold text-white dark:bg-[linear-gradient(135deg,#3A3A3F,#1F1F22)]">
          IK
        </div>
        <div>
          Signed in with <b className="font-semibold text-[var(--ik-ink)]">Google</b>
        </div>
      </div>

      <p className="m-0 max-w-[36ch] font-sans text-[13px] leading-5 text-[var(--ik-ink-3)]">
        Your watchlist, alerts and AI verdicts are ready. Let's go.
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-[11px] border-0 bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] px-5 font-sans text-[13.5px] font-semibold tracking-[-0.005em] text-white shadow-[0_8px_18px_-4px_rgba(43,107,255,0.40),0_1px_0_rgba(255,255,255,0.25)_inset] transition hover:-translate-y-px dark:bg-[linear-gradient(135deg,#3A3A3F,#1F1F22)] dark:shadow-[0_8px_18px_-4px_rgba(0,0,0,0.55)]"
      >
        Open my watchlist
        <ArrowRightIcon size={14} />
      </button>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="size-[22px]" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 1 1-3.3-13l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2a12 12 0 0 1-17.5-6.2l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
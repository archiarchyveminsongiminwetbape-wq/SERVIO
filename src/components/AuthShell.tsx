import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, GripHorizontal, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthShellProps {
  title: string;
  subtitle: string;
  visualTitle: string;
  visualSubtitle: string;
  children: ReactNode;
}

export default function AuthShell({ title, subtitle, visualTitle, visualSubtitle, children }: AuthShellProps) {
  const [revealed, setRevealed] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [pullDistance, setPullDistance] = useState(0);
  const pointerStartY = useRef<number | null>(null);
  const didDrag = useRef(false);
  const wasHidden = useRef(!revealed);
  const formPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const revealForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setRevealed(true);
    };

    motionPreference.addEventListener('change', revealForReducedMotion);
    return () => motionPreference.removeEventListener('change', revealForReducedMotion);
  }, []);

  useEffect(() => {
    if (!revealed || !wasHidden.current) return;
    wasHidden.current = false;

    if (window.matchMedia('(min-width: 768px)').matches) {
      formPanelRef.current?.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus({ preventScroll: true });
    } else {
      formPanelRef.current?.focus({ preventScroll: true });
    }
  }, [revealed]);

  const revealForm = () => {
    if (revealed) return;
    setRevealed(true);
  };

  const triggerPull = () => {
    if (revealed) return;
    setPullDistance(58);
    revealForm();
  };

  const handlePullStart = (event: PointerEvent<HTMLButtonElement>) => {
    if (revealed) return;
    pointerStartY.current = event.clientY;
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePullMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerStartY.current === null || revealed) return;
    const distance = Math.max(0, Math.min(58, event.clientY - pointerStartY.current));
    setPullDistance(distance);
    if (distance > 8) didDrag.current = true;
  };

  const handlePullEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerStartY.current === null) return;
    const pulled = event.clientY - pointerStartY.current;
    pointerStartY.current = null;

    if (pulled >= 34) {
      triggerPull();
    } else {
      setPullDistance(0);
    }
  };

  const handlePullClick = () => {
    triggerPull();
  };

  return (
    <main className="auth-page relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="auth-layout mx-auto grid w-full max-w-6xl items-stretch gap-5 lg:grid-cols-[1fr_0.82fr] lg:gap-8">
        <aside className="auth-visual relative hidden min-h-[660px] overflow-hidden rounded-[1.75rem] bg-primary-950 text-white lg:flex">
          <img
            src="/images/background.jpg"
            alt=""
            className="auth-visual-image absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="auth-visual-overlay absolute inset-0" />
          <div className="auth-visual-grid absolute inset-0" />
          <div className="auth-visual-content relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            <Link to="/" className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/15">
              <img src="/images/servio-logo.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
              SERVIO
              <ArrowUpRight size={16} className="text-primary-100" />
            </Link>

            <div className="max-w-xl pb-4">
              <div className="auth-kicker mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-md">
                <Sparkles size={14} />
                {visualSubtitle}
              </div>
              <h2 className="auth-visual-title max-w-lg text-4xl font-bold leading-[1.08] text-white xl:text-5xl">
                {visualTitle}
              </h2>
              <div className="auth-rule mt-8 h-1 w-20 rounded-full bg-accent-400" />
            </div>
          </div>
        </aside>

        <section className="auth-form-column flex items-center justify-center py-2 lg:py-8">
          <div className="auth-form-wrap w-full max-w-md">
            <Link to="/" className="auth-mobile-brand mb-7 inline-flex items-center gap-2.5 text-lg font-extrabold text-neutral-900 lg:hidden">
              <img src="/images/servio-logo.png" alt="" className="h-9 w-9 rounded-xl object-cover" />
              SERVIO
            </Link>

            <header className="auth-heading mb-6 sm:mb-7">
              <span className="auth-heading-mark mb-4 block h-1 w-10 rounded-full bg-accent-500" />
              <h1 className="text-3xl font-extrabold leading-tight text-neutral-900 sm:text-4xl">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">{subtitle}</p>
            </header>

            <div
              className={`auth-rope-stage ${revealed ? 'is-pulled' : ''}`}
              style={{ '--rope-pull': `${pullDistance}px` } as React.CSSProperties}
              aria-hidden={revealed}
            >
                <div className="auth-rope-line" aria-hidden="true" />
                <button
                  type="button"
                  className={`auth-rope-handle ${didDrag.current ? 'is-dragging' : ''}`}
                  onPointerDown={handlePullStart}
                  onPointerMove={handlePullMove}
                  onPointerUp={handlePullEnd}
                  onPointerCancel={handlePullEnd}
                  onClick={handlePullClick}
                  disabled={revealed}
                  tabIndex={revealed ? -1 : 0}
                  aria-label="Tirer la corde vers le bas pour afficher le formulaire"
                  aria-controls="auth-form-panel"
                >
                  <GripHorizontal size={21} aria-hidden="true" />
                  <span>Afficher le formulaire</span>
                  <ArrowDown size={16} className="auth-rope-arrow" aria-hidden="true" />
                </button>
                <p className="auth-rope-hint" aria-live="polite">Tirez la poignée vers le bas</p>
            </div>

            <div
              id="auth-form-panel"
              ref={formPanelRef}
              tabIndex={-1}
              className={`auth-reveal focus:outline-none ${revealed ? 'is-revealed' : ''}`}
              aria-hidden={!revealed}
            >
              <div className="auth-reveal-inner">
                <div className="auth-form-card rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_55px_rgba(23,49,43,0.09)] sm:p-8">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
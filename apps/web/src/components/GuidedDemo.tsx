"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  GUIDED_DEMO_PERSONAS,
  clearGuidedDemoProgress,
  createGuidedDemoProgress,
  getGuidedDemoPersona,
  guidedDemoExpiry,
  readGuidedDemoProgress,
  writeGuidedDemoProgress,
  type GuidedDemoExperience,
  type GuidedDemoIdentity,
  type GuidedDemoPersonaId,
  type GuidedDemoProgress,
} from "@/lib/guided-demo";
import styles from "./GuidedDemo.module.css";

export type GuidedDemoProps = {
  identity: GuidedDemoIdentity;
  activeModule: string;
  onNavigate: (label: string) => void;
  onNotify: (message: string) => void;
};

const personaMarks: Record<GuidedDemoPersonaId, string> = {
  executive: "EL",
  security: "SC",
  operations: "MO",
  reporting: "RF",
};

function formatRemaining(milliseconds: number | null) {
  if (milliseconds === null) return "--:--";
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function focusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}

export function GuidedDemo({
  identity,
  activeModule,
  onNavigate,
  onNotify,
}: GuidedDemoProps) {
  const persona = getGuidedDemoPersona(identity.demoPersona);
  const [progress, setProgress] = useState<GuidedDemoProgress>(() =>
    createGuidedDemoProgress(identity.demoPersona, identity.demoMode),
  );
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaBusy, setPersonaBusy] = useState<GuidedDemoPersonaId | null>(
    null,
  );
  const [personaError, setPersonaError] = useState("");
  const [restarting, setRestarting] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [fallbackExpiry, setFallbackExpiry] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const personaTriggerRef = useRef<HTMLButtonElement>(null);
  const personaDialogRef = useRef<HTMLDivElement>(null);
  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const warningAnnounced = useRef(false);
  const initialNavigation = useRef("");

  const steps = persona.steps;
  const safeStepIndex = Math.min(progress.stepIndex, steps.length - 1);
  const step = steps[safeStepIndex];
  const expiry = useMemo(
    () => guidedDemoExpiry(identity.expiresAt) ?? fallbackExpiry,
    [identity.expiresAt, fallbackExpiry],
  );
  const remaining = now === null || expiry === null ? null : expiry - now;
  const expired = remaining !== null && remaining <= 0;

  useEffect(() => {
    const saved = readGuidedDemoProgress();
    if (saved?.persona === identity.demoPersona) {
      setProgress({
        ...saved,
        stepIndex: Math.min(saved.stepIndex, persona.steps.length - 1),
      });
    } else {
      setProgress(
        createGuidedDemoProgress(identity.demoPersona, identity.demoMode),
      );
    }
    setHydrated(true);
  }, [identity.demoMode, identity.demoPersona, persona.steps.length]);

  useEffect(() => {
    if (!hydrated) return;
    writeGuidedDemoProgress(progress);
  }, [hydrated, progress]);

  useEffect(() => {
    const current = Date.now();
    setNow(current);
    if (!guidedDemoExpiry(identity.expiresAt)) {
      setFallbackExpiry(current + 30 * 60 * 1000);
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [identity.expiresAt]);

  useEffect(() => {
    if (remaining !== null && remaining <= 5 * 60 * 1000 && remaining > 0) {
      if (!warningAnnounced.current) {
        warningAnnounced.current = true;
        setLiveMessage("Five minutes remain in this protected demo session.");
      }
    }
    if (expired) {
      setLiveMessage(
        "The protected demo session has ended. Start a new session to continue.",
      );
    }
  }, [expired, remaining]);

  useEffect(() => {
    if (!hydrated || progress.experience !== "guided" || progress.complete) {
      return;
    }
    const navigationKey = `${progress.persona}:${step.id}`;
    if (initialNavigation.current === navigationKey) return;
    initialNavigation.current = navigationKey;
    onNavigate(step.module);
  }, [hydrated, onNavigate, progress.complete, progress.experience, progress.persona, step.id, step.module]);

  useEffect(() => {
    if (
      !hydrated ||
      progress.experience !== "guided" ||
      progress.complete ||
      activeModule !== step.module
    ) {
      return;
    }
    let target: HTMLElement | null = null;
    let targetHadTabIndex = false;
    const timer = window.setTimeout(() => {
      target = document.querySelector<HTMLElement>(
        `[data-tour-id="${step.anchor}"]`,
      );
      if (target) {
        target.setAttribute("data-guided-demo-target", "true");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        targetHadTabIndex = target.hasAttribute("tabindex");
        if (!targetHadTabIndex) target.setAttribute("tabindex", "-1");
      }
      stepTitleRef.current?.focus({ preventScroll: true });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      if (target) {
        target.removeAttribute("data-guided-demo-target");
        if (!targetHadTabIndex) target.removeAttribute("tabindex");
      }
    };
  }, [activeModule, hydrated, progress.complete, progress.experience, step.anchor, step.id, step.module]);

  useEffect(() => {
    if (!personaOpen) return;
    const dialog = personaDialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    focusableElements(dialog)[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPersonaOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(dialog);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      (previouslyFocused ?? personaTriggerRef.current)?.focus();
    };
  }, [personaOpen]);

  function moveToStep(index: number) {
    const nextIndex = Math.max(0, Math.min(index, steps.length - 1));
    const nextStep = steps[nextIndex];
    setProgress((current) => ({
      ...current,
      stepIndex: nextIndex,
      complete: false,
    }));
    setCollapsed(false);
    setLiveMessage(
      `Step ${nextIndex + 1} of ${steps.length}: ${nextStep.title}`,
    );
    initialNavigation.current = `${progress.persona}:${nextStep.id}`;
    onNavigate(nextStep.module);
  }

  function nextStep() {
    const completed = Array.from(
      new Set([...progress.completed, step.id]),
    );
    if (safeStepIndex === steps.length - 1) {
      setProgress((current) => ({ ...current, completed, complete: true }));
      setLiveMessage(
        `${persona.name} guided tour complete. You can now explore freely or restart the tour.`,
      );
      return;
    }
    const nextIndex = safeStepIndex + 1;
    const next = steps[nextIndex];
    setProgress((current) => ({
      ...current,
      completed,
      stepIndex: nextIndex,
    }));
    setLiveMessage(
      `Step ${nextIndex + 1} of ${steps.length}: ${next.title}`,
    );
    initialNavigation.current = `${progress.persona}:${next.id}`;
    onNavigate(next.module);
  }

  function switchToGuided() {
    const next = createGuidedDemoProgress(identity.demoPersona, "guided");
    setProgress(next);
    setCollapsed(false);
    setLiveMessage(`Guided ${persona.name} tour started.`);
    initialNavigation.current = `${next.persona}:${steps[0].id}`;
    onNavigate(steps[0].module);
  }

  function exploreFreely() {
    setProgress((current) => ({
      ...current,
      experience: "free",
      complete: true,
    }));
    setLiveMessage("Guidance closed. Free exploration mode is active.");
  }

  async function changePersona(nextPersona: GuidedDemoPersonaId) {
    if (nextPersona === identity.demoPersona) {
      setPersonaOpen(false);
      return;
    }
    setPersonaBusy(nextPersona);
    setPersonaError("");
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: nextPersona,
          mode: progress.experience,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(
          result.error || result.message || "The perspective could not be changed.",
        );
      }
      clearGuidedDemoProgress();
      onNotify("Perspective changed. Loading its guided workspace.");
      window.location.assign("/demo/workspace");
    } catch (error) {
      setPersonaError(
        error instanceof Error
          ? error.message
          : "The perspective could not be changed.",
      );
      setPersonaBusy(null);
    }
  }

  async function restart() {
    if (restarting) return;
    setRestarting(true);
    try {
      const response = await fetch("/api/public-demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(
          result.error || result.message || "The demo could not be restarted.",
        );
      }
      clearGuidedDemoProgress();
      const next = createGuidedDemoProgress(
        identity.demoPersona,
        progress.experience,
      );
      setProgress(next);
      setCollapsed(false);
      warningAnnounced.current = false;
      setLiveMessage("Demo state reset to its protected baseline.");
      onNotify("Demo state reset to its protected synthetic baseline.");
      if (next.experience === "guided") {
        initialNavigation.current = `${next.persona}:${steps[0].id}`;
        onNavigate(steps[0].module);
      }
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "The demo could not be restarted.",
      );
    } finally {
      setRestarting(false);
    }
  }

  async function exitDemo() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearGuidedDemoProgress();
      window.location.assign("/landing/demo");
    }
  }

  function onDrawerKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setCollapsed(true);
      setLiveMessage("Tour guidance collapsed.");
    }
  }

  if (!identity.sessionType.includes("demo")) return null;

  return (
    <>
      <div className={styles.liveRegion} aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <section className={styles.banner} aria-label="Guided demo session">
        <div className={styles.disclosure}>
          <span className={styles.demoDot} aria-hidden="true" />
          <span>
            <strong>Synthetic public demo</strong>
            <small>No customer data · No Microsoft 365 connection</small>
          </span>
        </div>
        <div className={styles.bannerContext}>
          <span>{persona.name}</span>
          <i aria-hidden="true" />
          <span>{activeModule}</span>
        </div>
        <div className={styles.bannerActions}>
          <span
            className={`${styles.timer} ${
              remaining !== null && remaining <= 5 * 60 * 1000
                ? styles.timerWarning
                : ""
            }`}
            title="Time remaining in this protected session"
          >
            <small>Session</small>
            <strong>{formatRemaining(remaining)}</strong>
          </span>
          {progress.experience === "free" && !expired && (
            <button type="button" onClick={switchToGuided}>
              Start guided tour
            </button>
          )}
          {progress.experience === "guided" && !expired && (
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-controls="guided-demo-drawer"
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? "Show guide" : "Hide guide"}
            </button>
          )}
          <button
            ref={personaTriggerRef}
            className={styles.personaButton}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={personaOpen}
            onClick={() => setPersonaOpen(true)}
          >
            Change perspective
          </button>
          <button className={styles.restartButton} type="button" onClick={restart} disabled={restarting || expired}>
            {restarting ? "Restarting…" : "Restart"}
          </button>
          <button className={styles.exitButton} type="button" onClick={exitDemo}>
            Exit
          </button>
        </div>
      </section>

      {expired && (
        <section className={styles.expired} role="alert" aria-labelledby="demo-expired-title">
          <div>
            <strong id="demo-expired-title">Your protected demo session has ended</strong>
            <p>No state or customer data was retained. Start a fresh session to continue.</p>
          </div>
          <a href="/landing/demo">Start a new session</a>
        </section>
      )}

      {!expired &&
        progress.experience === "guided" &&
        !collapsed && (
          <aside
            className={styles.drawer}
            id="guided-demo-drawer"
            aria-labelledby="guided-step-title"
            aria-describedby="guided-step-description"
            onKeyDown={onDrawerKeyDown}
          >
            {progress.complete ? (
              <div className={styles.complete}>
                <span aria-hidden="true">✓</span>
                <p className={styles.stepEyebrow}>Tour complete</p>
                <h2 id="guided-step-title">You have completed the {persona.name} route.</h2>
                <p id="guided-step-description">
                  Continue exploring this synthetic workspace or restart the route at any time.
                </p>
                <div className={styles.completeActions}>
                  <button type="button" onClick={exploreFreely}>
                    Explore freely
                  </button>
                  <button type="button" onClick={restart} disabled={restarting}>
                    Restart tour
                  </button>
                </div>
              </div>
            ) : (
              <>
                <header className={styles.drawerHeader}>
                  <div>
                    <span>
                      Step {safeStepIndex + 1} of {steps.length}
                    </span>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label="Guided tour progress"
                      aria-valuemin={1}
                      aria-valuemax={steps.length}
                      aria-valuenow={safeStepIndex + 1}
                    >
                      <i
                        style={{
                          width: `${((safeStepIndex + 1) / steps.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Collapse guided tour"
                    onClick={() => setCollapsed(true)}
                  >
                    ×
                  </button>
                </header>
                <div className={styles.stepContent}>
                  <p className={styles.stepEyebrow}>{step.eyebrow}</p>
                  <h2 id="guided-step-title" ref={stepTitleRef} tabIndex={-1}>
                    {step.title}
                  </h2>
                  <p id="guided-step-description">{step.description}</p>
                  <div className={styles.proof}>
                    <strong>What this proves</strong>
                    <span>{step.proof}</span>
                  </div>
                  {activeModule !== step.module && (
                    <button
                      className={styles.openModule}
                      type="button"
                      onClick={() => onNavigate(step.module)}
                    >
                      Open {step.module}
                    </button>
                  )}
                </div>
                <ol className={styles.milestones} aria-label="Tour milestones">
                  {steps.map((item, index) => (
                    <li
                      key={item.id}
                      className={
                        index === safeStepIndex
                          ? styles.currentMilestone
                          : progress.completed.includes(item.id)
                            ? styles.completedMilestone
                            : ""
                      }
                    >
                      <button
                        type="button"
                        aria-current={index === safeStepIndex ? "step" : undefined}
                        onClick={() => moveToStep(index)}
                      >
                        <span aria-hidden="true">
                          {progress.completed.includes(item.id) ? "✓" : index + 1}
                        </span>
                        <span>
                          <strong>{item.module}</strong>
                          <small>{item.eyebrow}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <footer className={styles.drawerFooter}>
                  <button
                    type="button"
                    disabled={safeStepIndex === 0}
                    onClick={() => moveToStep(safeStepIndex - 1)}
                  >
                    Back
                  </button>
                  <button className={styles.freeButton} type="button" onClick={exploreFreely}>
                    Explore freely
                  </button>
                  <button className={styles.nextButton} type="button" onClick={nextStep}>
                    {safeStepIndex === steps.length - 1 ? "Finish" : "Next"}
                    <span aria-hidden="true">→</span>
                  </button>
                </footer>
              </>
            )}
          </aside>
        )}

      {personaOpen && (
        <div className={styles.dialogBackdrop}>
          <div
            className={styles.personaDialog}
            ref={personaDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="persona-dialog-title"
            aria-describedby="persona-dialog-description"
          >
            <header>
              <div>
                <p>Guided perspective</p>
                <h2 id="persona-dialog-title">Choose another route</h2>
              </div>
              <button
                type="button"
                aria-label="Close perspective selector"
                onClick={() => setPersonaOpen(false)}
              >
                ×
              </button>
            </header>
            <p id="persona-dialog-description">
              Changing perspective creates a fresh, short-lived role view. It does not grant production access.
            </p>
            <div className={styles.personaOptions}>
              {GUIDED_DEMO_PERSONAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === identity.demoPersona ? styles.activePersona : ""}
                  aria-pressed={item.id === identity.demoPersona}
                  disabled={personaBusy !== null}
                  onClick={() => changePersona(item.id)}
                >
                  <span aria-hidden="true">{personaMarks[item.id]}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.roleLabel} · {item.duration}</small>
                  </span>
                  <b>{personaBusy === item.id ? "Loading…" : item.id === identity.demoPersona ? "Current" : "Choose"}</b>
                </button>
              ))}
            </div>
            {personaError && <p className={styles.dialogError} role="alert">{personaError}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export default GuidedDemo;

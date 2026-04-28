import { useEffect, useState } from "react";

interface IntroScreenProps {
  onContinue: () => void;
}

export function IntroScreen({ onContinue }: IntroScreenProps) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setLeaving(true);
        setTimeout(onContinue, 700);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [ready, onContinue]);

  const handleClick = () => {
    if (!ready) return;
    setLeaving(true);
    setTimeout(onContinue, 700);
  };

  return (
    <div
      onClick={handleClick}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer select-none ${
        leaving ? "animate-fade-out" : "animate-fade-in"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at center, oklch(0.22 0.05 200) 0%, oklch(0.1 0.02 240) 60%, oklch(0.06 0.01 240) 100%)",
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-xs tracking-[0.4em] text-primary uppercase animate-pulse-soft">
          <span className="h-px w-10 bg-primary/60" />
          CogniChain
          <span className="h-px w-10 bg-primary/60" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
          AI-Powered <br />
          <span className="text-gradient">Supply Chain System</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground">
          Powered by AI Decision Intelligence
        </p>

        <div className="mt-16 h-16 flex items-center justify-center">
          {ready ? (
            <div className="animate-fade-in flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-primary/40 bg-primary/5 animate-pulse-soft">
                <kbd className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold shadow-lg">
                  ENTER
                </kbd>
                <span className="text-foreground font-medium tracking-wide">
                  Press to Continue
                </span>
              </div>
              <span className="text-xs text-muted-foreground">or click anywhere</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
              <span className="ml-2">Initializing decision engine…</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 text-[10px] tracking-widest text-muted-foreground/60 uppercase">
        v2.0 · Decision Intelligence Suite
      </div>
    </div>
  );
}

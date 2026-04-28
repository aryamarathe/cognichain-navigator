import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IntroScreen } from "@/components/IntroScreen";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CogniChain — AI-Powered Supply Chain Decision Intelligence" },
      { name: "description", content: "CogniChain enhances supply chain operations with AI forecasting, smart inventory, real-time disruption response and predictive rerouting." },
    ],
  }),
});

function Index() {
  const [showIntro, setShowIntro] = useState(true);
  return (
    <>
      {showIntro && <IntroScreen onContinue={() => setShowIntro(false)} />}
      <Dashboard />
    </>
  );
}

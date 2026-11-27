import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function OceanExperience() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        root.style.setProperty("--ocean-progress", progress.toFixed(4));
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      root.style.removeProperty("--ocean-progress");
    };
  }, []);

  return (
    <div className="ocean-experience">
      <div className="ocean-backdrop" aria-hidden="true">
        <div className="ocean-sky" />
        <div className="ocean-horizon" />
        <div className="ocean-water ocean-water-back" />
        <div className="ocean-water ocean-water-front" />
        <div className="ocean-foam" />
        <div className="ocean-shore" />
      </div>
      <div className="ocean-content"><Outlet /></div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  component: OceanExperience,
});

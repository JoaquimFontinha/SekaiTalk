"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Redirect() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const m            = searchParams.get("m") ?? "";

  useEffect(() => {
    const dest = `/home/tutorial/tutorial-douane?quest=quest-tutorial-douane${m ? `&m=${m}` : ""}`;
    router.replace(dest);
  }, [router, m]);

  return <div style={{ position: "fixed", inset: 0, background: "#0e0c1a" }} />;
}

export default function DouanePage() {
  return (
    <Suspense>
      <Redirect />
    </Suspense>
  );
}

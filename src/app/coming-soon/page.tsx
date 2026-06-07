// TEMPORARY: Remove this page and its route when the gate is lifted.

import type { Metadata } from "next";
import ComingSoonClient from "./ComingSoonClient";

export const metadata: Metadata = {
  title: "SekaiTalk — Bientôt disponible",
  description: "SekaiTalk arrive bientôt.",
};

export default function ComingSoonPage() {
  return <ComingSoonClient />;
}

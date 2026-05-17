import { Suspense } from "react";
import LessonClient from "./LessonClient";

export default function LessonPage({
  params,
}: {
  params: { city: string; poi: string };
}) {
  return (
    <Suspense>
      <LessonClient citySlug={params.city} poiId={params.poi} />
    </Suspense>
  );
}

import { notFound } from "next/navigation";
import { getLesson } from "@/lib/basics-lessons";
import LessonPlayer from "./LessonPlayer";

export default async function LessonPage({
  params,
}: {
  params: { city: string; id: string };
}) {
  const lessonId = parseInt(params.id, 10);
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} citySlug={params.city} />;
}

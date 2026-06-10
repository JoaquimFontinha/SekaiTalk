import dynamic from "next/dynamic";
import { getCityFromDB } from "@/lib/cities-db";
import { notFound } from "next/navigation";

const SchoolClient = dynamic(() => import("./SchoolClient"), { ssr: false });

export default async function SchoolPage({ params }: { params: { city: string } }) {
  const slug = params.city.toLowerCase();
  const city = await getCityFromDB(slug);
  if (!city) notFound();
  return <SchoolClient citySlug={slug} cityName={city.name} />;
}

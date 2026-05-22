import dynamic from "next/dynamic";
import { getCityFromDB } from "@/lib/cities-db";
import type { CityData } from "@/lib/cities";

const CityClient = dynamic(() => import("./CityClient"), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "white" }} />,
});

export default async function CityPage({ params }: { params: { city: string } }) {
  const slug = params.city.toLowerCase();
  const cityData: CityData | null = await getCityFromDB(slug);
  return <CityClient citySlug={slug} initialCity={cityData} />;
}

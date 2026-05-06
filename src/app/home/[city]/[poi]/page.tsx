import dynamic from "next/dynamic";

const POIClient = dynamic(() => import("./POIClient"), { ssr: false });

export default function POIPage({
  params,
  searchParams,
}: {
  params: { city: string; poi: string };
  searchParams: { quest?: string };
}) {
  return <POIClient citySlug={params.city} poiId={params.poi} questId={searchParams.quest} />;
}

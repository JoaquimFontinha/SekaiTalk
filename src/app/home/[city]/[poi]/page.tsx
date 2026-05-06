import dynamic from "next/dynamic";

const POIClient = dynamic(() => import("./POIClient"), { ssr: false });

export default function POIPage({
  params,
}: {
  params: { city: string; poi: string };
}) {
  return <POIClient citySlug={params.city} poiId={params.poi} />;
}

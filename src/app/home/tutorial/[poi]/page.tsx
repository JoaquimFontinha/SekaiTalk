import dynamic from "next/dynamic";

const POIClient = dynamic(
  () => import("../../[city]/[poi]/POIClient"),
  { ssr: false }
);

export default function TutorialPoiPage({
  params,
  searchParams,
}: {
  params: { poi: string };
  searchParams: { quest?: string };
}) {
  return (
    <POIClient
      citySlug="tutorial"
      poiId={params.poi}
      questId={searchParams.quest}
    />
  );
}

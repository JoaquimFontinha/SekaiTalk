import dynamic from "next/dynamic";

const CityClient = dynamic(() => import("./CityClient"), { ssr: false });

export default function CityPage({ params }: { params: { city: string } }) {
  return <CityClient citySlug={params.city.toLowerCase()} />;
}

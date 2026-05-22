import dynamic from "next/dynamic";

const CityClient = dynamic(() => import("./CityClient"), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "white" }} />,
});

export default function CityPage({ params }: { params: { city: string } }) {
  return <CityClient citySlug={params.city.toLowerCase()} />;
}

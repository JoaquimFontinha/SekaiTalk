import { redirect } from "next/navigation";

export default function TutorialCityPage() {
  redirect("/home/tokyo?tuto=start");
}

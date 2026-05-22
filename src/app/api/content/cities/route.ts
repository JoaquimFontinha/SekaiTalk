import { NextResponse } from "next/server";
import { getAllCitiesFromDB } from "@/lib/cities-db";

export const revalidate = 0; // toujours frais

export async function GET() {
  const cities = await getAllCitiesFromDB();
  return NextResponse.json(cities);
}

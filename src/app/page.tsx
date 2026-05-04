import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="mb-12 text-6xl font-bold tracking-tight text-gray-900">
        SekaiTalk
      </h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg border border-gray-900 px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}

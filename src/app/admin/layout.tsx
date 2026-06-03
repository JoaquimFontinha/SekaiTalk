"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/cities", label: "Villes", icon: "🏙" },
  { href: "/admin/pois", label: "POIs", icon: "📍" },
  { href: "/admin/lessons", label: "Leçons", icon: "🎓" },
  { href: "/admin/quests", label: "Quêtes", icon: "📜" },
  { href: "/admin/sns",    label: "SNS",        icon: "💬" },
  { href: "/admin/events", label: "Évènements", icon: "🎉" },
  { href: "/admin/characters", label: "Personnages", icon: "🧑" },
  { href: "/admin/users", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/export", label: "Export/Import", icon: "📦" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !(session.user as any)?.isAdmin) {
      router.replace("/home");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-lg">Chargement...</div>
      </div>
    );
  }

  if (!session || !(session.user as any)?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Redirection...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-800 text-gray-100 flex flex-col fixed top-0 left-0 h-full z-50">
        <div className="px-4 py-5 border-b border-gray-700">
          <span className="text-lg font-bold text-violet-400">🗾 SekaiTalk</span>
          <div className="text-xs text-gray-400 mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 py-3 px-4">
          <Link
            href="/home"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Retour au jeu</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}

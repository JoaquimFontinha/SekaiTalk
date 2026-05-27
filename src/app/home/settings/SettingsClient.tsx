"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ArrowLeft, User, Bell, Shield, Globe, Moon, LogOut, ChevronRight,
} from "lucide-react";

type SettingRow = {
  icon: React.ReactNode;
  label: string;
  description?: string;
  action?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type SettingSection = {
  title: string;
  rows: SettingRow[];
};

export default function SettingsClient() {
  const router = useRouter();
  const { data: session } = useSession();

  const sections: SettingSection[] = [
    {
      title: "Compte",
      rows: [
        {
          icon: <User className="h-5 w-5 text-white" />,
          label: "Profil",
          description: session?.user?.email ?? "Non connecté",
          disabled: true,
        },
        {
          icon: <Shield className="h-5 w-5 text-white" />,
          label: "Sécurité",
          description: "Mot de passe, authentification",
          disabled: true,
        },
      ],
    },
    {
      title: "Préférences",
      rows: [
        {
          icon: <Bell className="h-5 w-5 text-white" />,
          label: "Notifications",
          description: "Rappels quotidiens, alertes",
          disabled: true,
        },
        {
          icon: <Globe className="h-5 w-5 text-white" />,
          label: "Langue de l'interface",
          description: "Français",
          disabled: true,
        },
        {
          icon: <Moon className="h-5 w-5 text-white" />,
          label: "Apparence",
          description: "Mode clair / sombre",
          disabled: true,
        },
      ],
    },
    {
      title: "Session",
      rows: [
        {
          icon: <LogOut className="h-5 w-5 text-white" />,
          label: "Se déconnecter",
          action: () => signOut({ callbackUrl: "/login" }),
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Paramètres</h1>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
              {section.title}
            </p>
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              {section.rows.map((row, i) => (
                <button
                  key={row.label}
                  onClick={row.action}
                  disabled={row.disabled}
                  className={`flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors
                    ${i > 0 ? "border-t border-gray-100" : ""}
                    ${row.disabled ? "opacity-40 cursor-default" : "hover:bg-gray-50 cursor-pointer"}
                    ${row.danger ? "hover:bg-red-50" : ""}
                  `}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: row.danger ? "#ef4444" : "#6366f1" }}
                  >
                    {row.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-[15px] font-semibold ${row.danger ? "text-red-600" : "text-gray-800"}`}>
                      {row.label}
                    </p>
                    {row.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{row.description}</p>
                    )}
                  </div>
                  {!row.disabled && !row.danger && (
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

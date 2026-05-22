"use client";

import { useRef, useState } from "react";

export default function ExportPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const res = await fetch("/api/admin/export");
    if (!res.ok) { alert("Erreur d'export"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sekai-content.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setPreview({
        cities: data.cityRecords?.length ?? 0,
        pois: data.poiRecords?.length ?? 0,
        scenes: data.scenes?.length ?? 0,
        characters: data.characters?.length ?? 0,
        appearances: data.appearances?.length ?? 0,
        quests: data.quests?.length ?? 0,
        lessons: data.lessons?.length ?? 0,
      });
      setImportError("");
    } catch {
      setImportError("Fichier JSON invalide");
      setPreview(null);
    }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    setImporting(true);
    setImportResult(null);
    setImportError("");
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setImporting(false);
    if (res.ok) {
      const result = await res.json();
      setImportResult(result.imported);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      const err = await res.json();
      setImportError(err.error || "Erreur lors de l'import");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Export / Import</h1>

      {/* Export */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Export</h2>
        <p className="text-sm text-gray-500 mb-4">
          Télécharge un fichier JSON contenant toutes les données de contenu : villes, POIs, scènes,
          personnages, quêtes (avec tâches et choix) et leçons (avec étapes).
        </p>
        <button onClick={handleExport}
          className="bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          Télécharger le JSON de contenu
        </button>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Import</h2>
        <p className="text-sm text-gray-500 mb-4">
          Importe un fichier JSON précédemment exporté. L&apos;import est idempotent — les données existantes
          sont mises à jour, les nouvelles sont créées.
        </p>

        {importError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{importError}</div>
        )}

        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-green-700 font-medium text-sm mb-2">Import réussi !</p>
            <ul className="text-sm text-green-600 space-y-1">
              {Object.entries(importResult).map(([k, v]) => (
                <li key={k}>{k}: {v as number} enregistrement(s)</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" />

          {preview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Aperçu du fichier :</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(preview).map(([k, v]) => (
                  <li key={k}>{k}: {v as number}</li>
                ))}
              </ul>
            </div>
          )}

          {preview && (
            <button onClick={handleImport} disabled={importing}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
              {importing ? "Import en cours..." : "Confirmer l'import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

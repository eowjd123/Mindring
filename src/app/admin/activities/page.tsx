"use client";

import React, { useEffect, useMemo, useState } from "react";

type MenuItem = { id: string; name: string; slug: string; order: number; visible: boolean };

export default function AdminActivitiesPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/activities-menu");
        const data = await res.json();
        setMenu(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => [...menu].sort((a, b) => a.order - b.order), [menu]);

  const addItem = () => {
    const id = crypto.randomUUID();
    setMenu((m) => [...m, { id, name: "새 메뉴", slug: `menu-${m.length + 1}`, order: m.length + 1, visible: true }]);
  };

  const saveMenu = async () => {
    const res = await fetch("/api/admin/activities-menu", { method: "PUT", body: JSON.stringify(menu) });
    if (res.ok) setMessage("메뉴 저장 완료");
    else setMessage("메뉴 저장 실패");
  };

  const upload = async () => {
    if (!file) { setMessage("파일을 선택하세요."); return; }
    const fd = new FormData();
    fd.append("file", file);
    if (fileId) fd.append("id", fileId);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setMessage(`업로드 완료: ${data.url}`); else setMessage(data.error || "업로드 실패");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="mx-auto max-w-[1200px] px-4 py-3">
          <h1 className="text-xl font-extrabold">활동자료 관리자</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 space-y-6">
        {message && (
          <div className="p-3 bg-teal-50 border-2 border-teal-200 rounded-lg text-teal-800">{message}</div>
        )}

        {/* 업로드 섹션 */}
        <section className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3">자료 업로드 (public/resources)</h2>
          <div className="grid sm:grid-cols-3 gap-3 items-center">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="sm:col-span-2" />
            <input
              type="text"
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              placeholder="파일명(선택, 확장자 자동 유지)"
              className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={upload} className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm">업로드</button>
            <a href="/resources/" className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm" target="_blank">폴더 열기</a>
          </div>
        </section>

        {/* 메뉴 섹션 */}
        <section className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">사이드메뉴 관리</h2>
            <div className="flex gap-2">
              <button onClick={addItem} className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm">추가</button>
              <button onClick={saveMenu} className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm">저장</button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">불러오는 중…</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((m) => (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-2">
                  <input
                    className="col-span-3 rounded border-2 border-gray-300 px-2 py-1 text-sm"
                    value={m.name}
                    onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x))}
                  />
                  <input
                    className="col-span-3 rounded border-2 border-gray-300 px-2 py-1 text-sm"
                    value={m.slug}
                    onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, slug: e.target.value } : x))}
                  />
                  <input
                    type="number"
                    className="col-span-2 rounded border-2 border-gray-300 px-2 py-1 text-sm"
                    value={m.order}
                    onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, order: Number(e.target.value) } : x))}
                  />
                  <label className="col-span-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={m.visible}
                      onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, visible: e.target.checked } : x))}
                    />
                    표시
                  </label>
                  <button
                    onClick={() => setMenu((list) => list.filter((x) => x.id !== m.id))}
                    className="col-span-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}



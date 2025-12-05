"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Eye, Search, Upload, Image as ImageIcon, X, FileText, Save, Tag } from "lucide-react";

type MenuItem = { id: string; name: string; slug: string; order: number; visible: boolean };

type ActivityResource = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  fileUrl?: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt?: string;
  popularScore: number;
  visible: boolean;
};

export default function AdminActivitiesPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [resources, setResources] = useState<ActivityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"menu" | "resources">("resources");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<ActivityResource | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [resourceForm, setResourceForm] = useState({
    title: "",
    subtitle: "",
    thumbnail: "",
    fileUrl: "",
    tags: [] as string[],
    category: "",
    popularScore: 0,
    visible: true,
  });
  const [newTag, setNewTag] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, resourcesRes] = await Promise.all([
        fetch("/api/admin/activities-menu"),
        fetch("/api/admin/activities-resources"),
      ]);

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenu(menuData);
      }

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setResources(resourcesData.resources || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category));
    return Array.from(cats).sort();
  }, [resources]);

  const filteredResources = useMemo(() => {
    let filtered = resources;
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    
    return filtered;
  }, [resources, searchQuery, selectedCategory]);

  const handleOpenResourceModal = (resource?: ActivityResource) => {
    if (resource) {
      setEditingResource(resource);
      setResourceForm({
        title: resource.title,
        subtitle: resource.subtitle || "",
        thumbnail: resource.thumbnail || "",
        fileUrl: resource.fileUrl || "",
        tags: [...resource.tags],
        category: resource.category,
        popularScore: resource.popularScore,
        visible: resource.visible,
      });
    } else {
      setEditingResource(null);
      setResourceForm({
        title: "",
        subtitle: "",
        thumbnail: "",
        fileUrl: "",
        tags: [],
        category: "",
        popularScore: 0,
        visible: true,
      });
    }
    setThumbnailFile(null);
    setPdfFile(null);
    setNewTag("");
    setShowResourceModal(true);
  };

  const handleCloseResourceModal = () => {
    setShowResourceModal(false);
    setEditingResource(null);
    setResourceForm({
      title: "",
      subtitle: "",
      thumbnail: "",
      fileUrl: "",
      tags: [],
      category: "",
      popularScore: 0,
      visible: true,
    });
    setThumbnailFile(null);
    setPdfFile(null);
    setNewTag("");
  };

  const handleAddTag = () => {
    if (newTag.trim() && !resourceForm.tags.includes(newTag.trim())) {
      setResourceForm({
        ...resourceForm,
        tags: [...resourceForm.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setResourceForm({
      ...resourceForm,
      tags: resourceForm.tags.filter(t => t !== tag),
    });
  };

  const handleUploadThumbnail = async () => {
    if (!thumbnailFile) return null;

    const formData = new FormData();
    formData.append("file", thumbnailFile);
    formData.append("folder", "activities/thumbnails");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        return data.url;
      }
      throw new Error(data.error || "업로드 실패");
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
      return null;
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) return null;

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("folder", "activities/files");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        return data.url;
      }
      throw new Error(data.error || "업로드 실패");
    } catch (error) {
      console.error("PDF upload failed:", error);
      return null;
    }
  };

  const handleSaveResource = async () => {
    if (!resourceForm.title || !resourceForm.category) {
      setMessage({ type: "error", text: "제목과 카테고리는 필수입니다." });
      return;
    }

    try {
      setUploading(true);
      let thumbnailUrl = resourceForm.thumbnail;
      let fileUrl = resourceForm.fileUrl;

      if (thumbnailFile) {
        const uploaded = await handleUploadThumbnail();
        if (uploaded) thumbnailUrl = uploaded;
      }

      if (pdfFile) {
        const uploaded = await handleUploadPdf();
        if (uploaded) fileUrl = uploaded;
      }

      const payload: any = {
        ...resourceForm,
        thumbnail: thumbnailUrl,
        fileUrl: fileUrl,
      };

      const url = editingResource
        ? "/api/admin/activities-resources"
        : "/api/admin/activities-resources";
      const method = editingResource ? "PUT" : "POST";

      if (editingResource) {
        payload.id = editingResource.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: editingResource ? "활동자료가 수정되었습니다." : "활동자료가 추가되었습니다." });
        handleCloseResourceModal();
        fetchData();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "저장에 실패했습니다." });
      }
    } catch (error) {
      console.error("Save failed:", error);
      setMessage({ type: "error", text: "저장 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/activities-resources?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "활동자료가 삭제되었습니다." });
        fetchData();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "삭제에 실패했습니다." });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    }
  };

  const sorted = useMemo(() => [...menu].sort((a, b) => a.order - b.order), [menu]);

  const addMenuItem = () => {
    const id = crypto.randomUUID();
    setMenu((m) => [...m, { id, name: "새 메뉴", slug: `menu-${m.length + 1}`, order: m.length + 1, visible: true }]);
  };

  const saveMenu = async () => {
    const res = await fetch("/api/admin/activities-menu", { method: "PUT", body: JSON.stringify(menu) });
    if (res.ok) setMessage({ type: "success", text: "메뉴 저장 완료" });
    else setMessage({ type: "error", text: "메뉴 저장 실패" });
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">활동자료 관리</h1>
          <p className="mt-2 text-gray-600">활동자료와 카테고리 메뉴를 관리할 수 있습니다</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message.text}
          </div>
        )}

        {/* 탭 메뉴 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("resources")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "resources"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              활동자료 관리
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "menu"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              카테고리 메뉴 관리
            </button>
          </div>
        </div>

        {/* 활동자료 관리 탭 */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목, 부제목, 태그로 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">전체 카테고리</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleOpenResourceModal()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  새 활동자료
                </button>
              </div>
            </div>

            {/* 활동자료 목록 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">활동자료가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-[3/4] bg-gray-100">
                        {resource.thumbnail ? (
                          <img
                            src={resource.thumbnail}
                            alt={resource.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {!resource.visible && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                            숨김
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{resource.title}</h3>
                        {resource.subtitle && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{resource.subtitle}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {resource.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>{resource.category}</span>
                          <span>인기도: {resource.popularScore}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenResourceModal(resource)}
                            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 카테고리 메뉴 관리 탭 */}
        {activeTab === "menu" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">사이드메뉴 관리</h2>
              <div className="flex gap-2">
                <button
                  onClick={addMenuItem}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  추가
                </button>
                <button
                  onClick={saveMenu}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  저장
                </button>
              </div>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">불러오는 중…</p>
            ) : (
              <div className="space-y-2">
                {sorted.map((m) => (
                  <div key={m.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3">
                    <input
                      className="col-span-3 rounded border-2 border-gray-300 px-2 py-1 text-sm"
                      value={m.name}
                      onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x))}
                      placeholder="메뉴 이름"
                    />
                    <input
                      className="col-span-3 rounded border-2 border-gray-300 px-2 py-1 text-sm"
                      value={m.slug}
                      onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, slug: e.target.value } : x))}
                      placeholder="슬러그"
                    />
                    <input
                      type="number"
                      className="col-span-2 rounded border-2 border-gray-300 px-2 py-1 text-sm"
                      value={m.order}
                      onChange={(e) => setMenu((list) => list.map((x) => x.id === m.id ? { ...x, order: Number(e.target.value) } : x))}
                      placeholder="순서"
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
                      className="col-span-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 활동자료 추가/수정 모달 */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingResource ? "활동자료 수정" : "새 활동자료 추가"}
                </h2>
                <button
                  onClick={handleCloseResourceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="활동자료 제목"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">부제목</label>
                  <input
                    type="text"
                    value={resourceForm.subtitle}
                    onChange={(e) => setResourceForm({ ...resourceForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="활동자료 부제목"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="카테고리 이름"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="태그 입력 후 Enter"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resourceForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">썸네일 이미지</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {resourceForm.thumbnail && !thumbnailFile && (
                      <img src={resourceForm.thumbnail} alt="썸네일" className="mt-2 w-full h-32 object-cover rounded" />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PDF 파일</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {resourceForm.fileUrl && !pdfFile && (
                      <a
                        href={resourceForm.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-sm text-indigo-600 hover:underline"
                      >
                        현재 파일 보기
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">인기도 점수</label>
                    <input
                      type="number"
                      value={resourceForm.popularScore}
                      onChange={(e) => setResourceForm({ ...resourceForm, popularScore: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시 여부</label>
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={resourceForm.visible}
                        onChange={(e) => setResourceForm({ ...resourceForm, visible: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">사용자에게 표시</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveResource}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={handleCloseResourceModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

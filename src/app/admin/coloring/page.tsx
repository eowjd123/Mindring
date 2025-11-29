"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Search, Upload, Image as ImageIcon, X, Droplet, Trash } from "lucide-react";
import Link from "next/link";

interface ColoringTemplate {
  id: string;
  name: string;
  groupId?: string;
  groupName?: string;
  original: string;
  outline: string;
  palette?: Array<{ name: string; hex: string }>;
  createdAt?: string;
  updatedAt?: string;
}

interface ColoringGroup {
  id: string;
  name: string;
  description?: string;
  order: number;
  createdAt?: string;
}

export default function AdminColoringPage() {
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);
  const [groups, setGroups] = useState<ColoringGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: "",
    groupId: "",
    originalFile: null as File | null,
    outlineFile: null as File | null,
    palette: [] as Array<{ name: string; hex: string }>,
  });
  const [originalImageRef, setOriginalImageRef] = useState<HTMLImageElement | null>(null);
  const [isEyedropperMode, setIsEyedropperMode] = useState(false);
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
  });
  const [uploading, setUploading] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, groupsRes] = await Promise.all([
        fetch("/api/admin/coloring"),
        fetch("/api/admin/coloring/groups"),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageColorPick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !originalImageRef) return;

    const img = e.currentTarget;
    
    // 이미지가 완전히 로드되지 않았으면 대기
    if (!img.complete || img.naturalWidth === 0) {
      setMessage({ type: "error", text: "이미지가 아직 로드 중입니다. 잠시 후 다시 시도해주세요." });
      return;
    }

    // 이미지의 실제 크기와 표시 크기
    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 클릭 위치를 이미지의 실제 픽셀 좌표로 변환
    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const pixelX = Math.floor(clickX * scaleX);
    const pixelY = Math.floor(clickY * scaleY);

    // Canvas에서 색상 추출
    try {
      // 임시 canvas 생성 (이미지가 로드된 후)
      const canvas = document.createElement("canvas");
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        setMessage({ type: "error", text: "색상 추출에 실패했습니다." });
        return;
      }

      // 이미지를 canvas에 그리기
      ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);
      
      // 클릭한 위치의 픽셀 색상 추출
      const imageData = ctx.getImageData(pixelX, pixelY, 1, 1);
      const [r, g, b, a] = imageData.data;

      // 투명도가 너무 낮으면 무시
      if (a < 128) {
        setMessage({ type: "error", text: "투명한 영역입니다. 다른 위치를 선택해주세요." });
        return;
      }

      // RGB를 HEX로 변환
      const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

      // 중복 체크 (대소문자 구분 없이)
      const normalizedHex = hex.toUpperCase();
      if (uploadData.palette.some((c) => c.hex.toUpperCase() === normalizedHex)) {
        setMessage({ type: "error", text: "이미 팔레트에 있는 색상입니다." });
        return;
      }

      // 색상 이름 자동 생성
      const colorName = `색상 ${uploadData.palette.length + 1}`;

      setUploadData({
        ...uploadData,
        palette: [...uploadData.palette, { name: colorName, hex: normalizedHex }],
      });

      setMessage({ type: "success", text: `색상 ${normalizedHex}이(가) 팔레트에 추가되었습니다.` });
    } catch (error) {
      console.error("Color pick error:", error);
      setMessage({ type: "error", text: "색상 추출 중 오류가 발생했습니다." });
    }
  };

  const handleUpload = async () => {
    if (!uploadData.name || !uploadData.originalFile || !uploadData.outlineFile) {
      setMessage({ type: "error", text: "모든 필드를 입력해주세요." });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("name", uploadData.name);
      if (uploadData.groupId) {
        formData.append("groupId", uploadData.groupId);
      }
      formData.append("original", uploadData.originalFile);
      formData.append("outline", uploadData.outlineFile);
      if (uploadData.palette.length > 0) {
        formData.append("palette", JSON.stringify(uploadData.palette));
      }

      const res = await fetch("/api/admin/coloring", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage({ type: "success", text: "도안이 성공적으로 업로드되었습니다." });
        setShowUploadModal(false);
        setUploadData({ name: "", groupId: "", originalFile: null, outlineFile: null, palette: [] });
        setIsEyedropperMode(false);
        setOriginalImageRef(null);
        fetchData();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "업로드에 실패했습니다." });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "error", text: "업로드 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupData.name) {
      setMessage({ type: "error", text: "그룹 이름을 입력해주세요." });
      return;
    }

    try {
      setSavingGroup(true);
      const res = await fetch("/api/admin/coloring/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "그룹이 생성되었습니다." });
        setShowGroupModal(false);
        setGroupData({ name: "", description: "" });
        fetchData();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "그룹 생성에 실패했습니다." });
      }
    } catch (error) {
      console.error("Create group failed:", error);
      setMessage({ type: "error", text: "그룹 생성 중 오류가 발생했습니다." });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 도안을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/coloring/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "도안이 삭제되었습니다." });
        fetchData();
      } else {
        setMessage({ type: "error", text: "삭제에 실패했습니다." });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === "all" || template.groupId === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">마음색칠 도안 관리</h1>
          <p className="mt-2 text-gray-600">색칠 도안을 업로드하고 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGroupModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>그룹 추가</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>도안 추가</span>
          </button>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 그룹 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 그룹 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedGroup("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGroup === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedGroup === group.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="도안 이름으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 도안 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? "검색 결과가 없습니다" : "도안이 없습니다. 도안을 추가해주세요."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* 도안 미리보기 */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50">
                  <div className="relative aspect-square bg-white rounded border border-gray-200 overflow-hidden">
                    <img
                      src={template.original}
                      alt={`${template.name} 원본`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/img/icon_4.png";
                      }}
                    />
                  </div>
                  <div className="relative aspect-square bg-white rounded border border-gray-200 overflow-hidden">
                    <img
                      src={template.outline}
                      alt={`${template.name} 도안`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/img/icon_4.png";
                      }}
                    />
                  </div>
                </div>

                {/* 도안 정보 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.groupName && (
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        {template.groupName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <ImageIcon className="h-4 w-4" />
                    <span>원본 + 도안</span>
                  </div>

                  {/* 작업 버튼 */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/services/coloring?template=${template.id}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span>미리보기</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      aria-label="삭제"
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

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">도안 업로드</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData({ name: "", groupId: "", originalFile: null, outlineFile: null, palette: [] });
                    setIsEyedropperMode(false);
                    setOriginalImageRef(null);
                    setMessage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 도안 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    도안 이름 *
                  </label>
                  <input
                    type="text"
                    value={uploadData.name}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, name: e.target.value })
                    }
                    placeholder="예: 강, 꽃, 나비 등"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 그룹 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    그룹 (선택사항)
                  </label>
                  <select
                    value={uploadData.groupId}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, groupId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">그룹 없음</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 원본 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    원본 이미지 (참고용) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          originalFile: e.target.files?.[0] || null,
                        })
                      }
                      className="hidden"
                      id="original-upload"
                    />
                    <label
                      htmlFor="original-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadData.originalFile
                          ? uploadData.originalFile.name
                          : "원본 이미지 선택"}
                      </span>
                    </label>
                    {uploadData.originalFile && (
                      <div className="mt-4 space-y-3">
                        <div className="relative">
                          <img
                            ref={(img) => {
                              if (img) {
                                setOriginalImageRef(img);
                              }
                            }}
                            src={URL.createObjectURL(uploadData.originalFile)}
                            alt="원본 미리보기"
                            className={`max-h-64 w-auto mx-auto rounded-lg border-2 ${
                              isEyedropperMode
                                ? "border-indigo-500 cursor-crosshair"
                                : "border-gray-200"
                            }`}
                            onClick={handleImageColorPick}
                            style={{ cursor: isEyedropperMode ? "crosshair" : "default" }}
                            onLoad={() => {
                              // 이미지 로드 완료 확인용
                              console.log("Image loaded");
                            }}
                          />
                          {isEyedropperMode && (
                            <div className="absolute top-2 left-2 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg z-10">
                              🎨 이미지를 클릭하여 색상 추출
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEyedropperMode(!isEyedropperMode)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isEyedropperMode
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <Droplet className="h-4 w-4" />
                            색상 추출 모드
                          </button>
                          {isEyedropperMode && (
                            <span className="text-xs text-gray-500">
                              이미지를 클릭하면 색상이 팔레트에 추가됩니다
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 도안 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    도안 이미지 (색칠할 영역) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          outlineFile: e.target.files?.[0] || null,
                        })
                      }
                      className="hidden"
                      id="outline-upload"
                    />
                    <label
                      htmlFor="outline-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadData.outlineFile
                          ? uploadData.outlineFile.name
                          : "도안 이미지 선택"}
                      </span>
                    </label>
                    {uploadData.outlineFile && (
                      <div className="mt-4">
                        <img
                          src={URL.createObjectURL(uploadData.outlineFile)}
                          alt="도안 미리보기"
                          className="max-h-48 mx-auto rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 색상 팔레트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추출된 색상 팔레트 {uploadData.palette.length > 0 && `(${uploadData.palette.length}개)`}
                  </label>
                  {uploadData.palette.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3 max-h-64 overflow-y-auto">
                        {uploadData.palette.map((color, index) => (
                          <div
                            key={index}
                            className="relative group"
                          >
                            <div
                              className="aspect-square rounded-lg border-2 border-gray-300 shadow-sm"
                              style={{ backgroundColor: color.hex }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPalette = uploadData.palette.filter((_, i) => i !== index);
                                setUploadData({ ...uploadData, palette: newPalette });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="색상 제거"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                            <div className="mt-1 text-xs text-center text-gray-600 truncate">
                              {color.name}
                            </div>
                            <div className="text-xs text-center text-gray-400 font-mono">
                              {color.hex}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadData({ ...uploadData, palette: [] })}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        전체 삭제
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center text-gray-500 text-sm">
                      색상 추출 모드를 활성화하고 원본 이미지를 클릭하여 색상을 추가하세요.
                    </div>
                  )}
                </div>

                {/* 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>안내:</strong> 원본 이미지는 색칠이 완료된 참고용 이미지이고,
                    도안 이미지는 검은색 윤곽선만 있는 색칠 가능한 이미지입니다.
                    <br />
                    <strong>색상 추출:</strong> 원본 이미지에서 색상을 추출하여 팔레트에 추가할 수 있습니다.
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadData({ name: "", originalFile: null, outlineFile: null });
                      setMessage(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "업로드 중..." : "업로드"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 그룹 생성 모달 */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">그룹 생성</h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupData({ name: "", description: "" });
                    setMessage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 그룹 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    그룹 이름 *
                  </label>
                  <input
                    type="text"
                    value={groupData.name}
                    onChange={(e) =>
                      setGroupData({ ...groupData, name: e.target.value })
                    }
                    placeholder="예: 동물, 자연, 꽃 등"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 그룹 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={groupData.description}
                    onChange={(e) =>
                      setGroupData({ ...groupData, description: e.target.value })
                    }
                    placeholder="그룹에 대한 설명을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowGroupModal(false);
                      setGroupData({ name: "", description: "" });
                      setMessage(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={savingGroup}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingGroup ? "생성 중..." : "생성"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


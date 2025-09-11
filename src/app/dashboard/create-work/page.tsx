// src/app/dashboard/create-work/page.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Copy,
  Crop,
  Download,
  Edit,
  Eye,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/* =====================
 * Types
 * ===================== */
type PageKind = 'text' | 'image' | 'mixed';

interface PageContent {
  type: PageKind;
  text?: string;
  imageUrl?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  imagePosition?: 'top' | 'bottom' | 'left' | 'right';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  /** 캔버스 방향: 세로(기본) | 가로 */
  orientation?: 'portrait' | 'landscape';
}

interface Page {
  id: string;
  orderIndex: number;
  contentType: PageKind;
  contentJson: PageContent;
}

type ClientStatus = 'draft' | 'completed';

interface Work {
  id: string;
  title: string;
  coverImage?: string;
  status: ClientStatus;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}

interface ServerWorkResponse {
  id: string;
  title: string;
  coverImage?: string;
  status?: string;
  pages?: Array<{
    id?: string;
    orderIndex?: number;
    order?: number;
    contentType?: string;
    type?: string;
    contentJson?: PageContent;
    content?: PageContent;
  }>;
  createdAt: string;
  updatedAt: string;
}

/* =====================
 * API Helpers
 * ===================== */
const workAPI = {
  async getById(id: string): Promise<ServerWorkResponse> {
    const res = await fetch(`/api/works/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { error?: string }));
      throw new Error((err as { error?: string })?.error || 'Failed to load work');
    }
    return res.json();
  },
  async create(data: {
    title: string;
    coverImage?: string;
    pages: Array<{ type: string; content: PageContent }>;
    status?: string;
  }): Promise<Work> {
    const res = await fetch('/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { error?: string }));
      throw new Error((err as { error?: string })?.error || 'Failed to create work');
    }
    return res.json();
  },
  async update(data: {
    id: string;
    title: string;
    coverImage?: string;
    pages: Array<{ type: string; content: PageContent }>;
    status?: string;
  }): Promise<Work> {
    const res = await fetch('/api/works', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { error?: string }));
      throw new Error((err as { error?: string })?.error || 'Failed to update work');
    }
    return res.json();
  },
};

/* =====================
 * Utility Functions
 * ===================== */
function serverStatusToClient(status?: string): ClientStatus {
  if (!status) return 'draft';
  const normalized = status.toLowerCase();
  return normalized === 'completed' ? 'completed' : 'draft';
}

function clientStatusToServer(status: ClientStatus): string {
  return status === 'completed' ? 'completed' : 'draft';
}

function serverPageTypeToClient(type?: string): Page['contentType'] {
  const normalized = (type || '').toLowerCase();
  if (normalized === 'image') return 'image';
  if (normalized === 'mixed') return 'mixed';
  return 'text';
}

/* =====================
 * Image Editor Component
 * ===================== */
interface ImageEditorProps {
  src: string;
  alt: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ src, alt, onSave, onCancel }) => {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  const transform = useMemo(
    () =>
      [
        rotation ? `rotate(${rotation}deg)` : '',
        flipH ? 'scaleX(-1)' : '',
        flipV ? 'scaleY(-1)' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [rotation, flipH, flipV]
  );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">이미지 편집</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setRotation((v) => (v + 90) % 360)}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRotation((v) => (v - 90 + 360) % 360)}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFlipH((v) => !v)}>
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFlipV((v) => !v)}>
            <FlipVertical className="w-4 h-4" />
          </Button>
          <Button
            variant={isCropping ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsCropping((v) => !v)}
          >
            <Crop className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative mb-4 flex justify-center">
          <img src={src} alt={alt} className="max-w-full max-h-96 object-contain" style={{ transform }} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={() => onSave(src)}>저장</Button>
        </div>
      </div>
    </div>
  );
};

/* =====================
 * Save Dialog Component
 * ===================== */
interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, coverImage: string, status: ClientStatus) => void;
  currentTitle: string;
  currentCoverImage: string;
  isLoading?: boolean;
  initialStatus?: ClientStatus;
}

const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTitle,
  currentCoverImage,
  isLoading = false,
  initialStatus = 'draft',
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [coverImage, setCoverImage] = useState(currentCoverImage);
  const [status, setStatus] = useState<ClientStatus>(initialStatus);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setCoverImage(currentCoverImage);
      setStatus(initialStatus);
    }
  }, [isOpen, currentTitle, currentCoverImage, initialStatus]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') setCoverImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    onSave(title, coverImage, status);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>저장</DialogTitle>
          <DialogDescription>작품 정보를 입력하고 저장하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">제목 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="작품 제목을 입력하세요"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">표지 이미지</label>
            <div className="space-y-2">
              {coverImage && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <img src={coverImage} alt="표지" className="w-full h-full object-cover" />
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
                disabled={isLoading}
              >
                표지 선택하기
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">상태</label>
            <RadioGroup
              value={status}
              onValueChange={(v) => setStatus(v as ClientStatus)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="status-draft" value="draft" disabled={isLoading} />
                <label htmlFor="status-draft" className="text-sm">임시저장</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="status-completed" value="completed" disabled={isLoading} />
                <label htmlFor="status-completed" className="text-sm">완성</label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* =====================
 * Preview Dialog Component
 * ===================== */
interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
  title: string;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({ isOpen, onClose, pages, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(4);
  const timerRef = useRef<number | null>(null);

  const nextPage = () => setCurrentIndex((prev) => (prev + 1) % Math.max(pages.length, 1));
  const prevPage = () => setCurrentIndex((prev) => (prev - 1 + Math.max(pages.length, 1)) % Math.max(pages.length, 1));

  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPlaying(false);
    } else {
      timerRef.current = window.setInterval(nextPage, intervalSeconds * 1000);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const currentPage = pages[currentIndex];
  const pOri: 'portrait' | 'landscape' =
    currentPage?.contentJson.orientation ?? 'portrait';
  const previewWidth = pOri === 'landscape' ? 880 : 640;
  const previewAspect = pOri === 'landscape' ? 4 / 3 : 3 / 4; // 숫자로!

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4">
          {currentPage ? (
            <div
              key={`${currentPage.id}-${pOri}`} // 방향 바뀌면 강제 리마운트
              className="relative bg-white border rounded-lg shadow overflow-hidden"
              style={{ width: previewWidth, maxWidth: '100%', aspectRatio: previewAspect }}
            >
              <div className="absolute inset-0 overflow-auto p-6">
                {currentPage.contentJson.imageUrl && (
                  <div className="mb-4">
                    <img src={currentPage.contentJson.imageUrl} alt="" className="w-full h-auto rounded" />
                  </div>
                )}
                {currentPage.contentJson.text && (
                  <div
                    style={{
                      fontSize: `${currentPage.contentJson.fontSize || 16}px`,
                      fontFamily: currentPage.contentJson.fontFamily || 'inherit',
                      fontWeight: currentPage.contentJson.fontWeight || 'normal',
                      color: currentPage.contentJson.color || 'inherit',
                      textAlign: currentPage.contentJson.textAlign || 'left',
                      lineHeight: 1.6,
                    }}
                  >
                    {currentPage.contentJson.text}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">페이지가 없습니다</div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPage}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={nextPage}>
            <SkipForward className="w-4 h-4" />
          </Button>
          <Select
            value={String(intervalSeconds)}
            onValueChange={(v) => setIntervalSeconds(Number(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2초</SelectItem>
              <SelectItem value="4">4초</SelectItem>
              <SelectItem value="6">6초</SelectItem>
              <SelectItem value="8">8초</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">
            {Math.min(currentIndex + 1, pages.length)} / {pages.length}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================
 * Main Component
 * ===================== */
export default function CreateWorkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workIdFromQuery = searchParams.get('id');

  // State
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [currentWorkId, setCurrentWorkId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<ClientStatus>('draft');

  // Modal states
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editingImageSrc, setEditingImageSrc] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize work data
  useEffect(() => {
    let cancelled = false;

    async function initializeWork() {
      setIsBootLoading(true);
      try {
        if (workIdFromQuery) {
          const serverWork = await workAPI.getById(workIdFromQuery);
          if (cancelled) return;

          setCurrentWorkId(serverWork.id);
          setTitle(serverWork.title || '');
          setCoverImage(serverWork.coverImage || '');
          setInitialStatus(serverStatusToClient(serverWork.status));

          const adaptedPages: Page[] = (serverWork.pages || []).map((p, i) => {
            const contentType = serverPageTypeToClient(p.contentType || p.type);

            // 안전 병합: 중복 키(type) 사전 제거
            const raw = (p.contentJson || p.content || {}) as Partial<PageContent>;
            const { type: _ignoreType, ...rest } = raw;

            const contentJson: PageContent = {
              // 기본값
              text: contentType === 'image' ? undefined : '',
              imageSize: 'medium',
              imagePosition: 'top',
              // 서버값
              ...rest,
              // 최종 확정 키들
              type: contentType,
              orientation: (rest.orientation as 'portrait' | 'landscape') ?? 'portrait',
            };

            return {
              id: p.id || `page_${Date.now()}_${i}`,
              orderIndex: p.orderIndex ?? p.order ?? i,
              contentType,
              contentJson,
            };
          });

          adaptedPages.sort((a, b) => a.orderIndex - b.orderIndex);
          setPages(adaptedPages);
          setSelectedPageId(adaptedPages[0]?.id ?? null);
        } else {
          // New document
          setPages([]);
          setSelectedPageId(null);
          setTitle('');
          setCoverImage('');
          setCurrentWorkId(null);
          setInitialStatus('draft');
        }
      } catch (error) {
        console.error('Failed to load work:', error);
        toast.error('작품을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setIsBootLoading(false);
      }
    }

    initializeWork();
    return () => {
      cancelled = true;
    };
  }, [workIdFromQuery]);

  // Page management functions
  const addPage = useCallback((type: PageKind = 'mixed') => {
    const newPage: Page = {
      id: `page_${Date.now()}`,
      orderIndex: pages.length,
      contentType: type,
      contentJson: {
        type,
        text: type === 'image' ? undefined : '텍스트를 입력하세요',
        fontSize: 16,
        fontFamily: '나눔스퀘어',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        imageSize: 'medium',
        imagePosition: 'top',
        orientation: 'portrait', // 기본은 세로
      },
    };
    setPages((prev) => [...prev, newPage]);
    setSelectedPageId(newPage.id);
  }, [pages.length]);

  const deletePage = useCallback((pageId: string) => {
    setPages((prev) =>
      prev
        .filter((p) => p.id !== pageId)
        .map((p, i) => ({ ...p, orderIndex: i }))
    );
    if (selectedPageId === pageId) setSelectedPageId(null);
    setPageToDelete(null);
    setShowDeleteConfirm(false);
  }, [selectedPageId]);

  const duplicatePage = useCallback((pageId: string) => {
    const original = pages.find((p) => p.id === pageId);
    if (!original) return;

    const cloned: Page = {
      ...original,
      id: `page_${Date.now()}`,
      orderIndex: pages.length,
    };
    setPages((prev) => [...prev, cloned]);
  }, [pages]);

  const movePage = useCallback((pageId: string, direction: 'up' | 'down') => {
    const currentIndex = pages.findIndex((p) => p.id === pageId);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    [newPages[currentIndex], newPages[targetIndex]] = [newPages[targetIndex], newPages[currentIndex]];
    newPages.forEach((p, i) => (p.orderIndex = i));
    setPages(newPages);
  }, [pages]);

  const updatePageContent = useCallback((pageId: string, updates: Partial<PageContent>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, contentJson: { ...p.contentJson, ...updates } } : p
      )
    );
  }, []);

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPageId) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        updatePageContent(selectedPageId, { imageUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const startImageEdit = (src: string) => {
    setEditingImageSrc(src);
    setIsImageEditorOpen(true);
  };

  const handleImageEditSave = (url: string) => {
    if (selectedPageId) {
      updatePageContent(selectedPageId, { imageUrl: url });
    }
    setIsImageEditorOpen(false);
    setEditingImageSrc('');
  };

  // Save functionality
  const handleSave = async (workTitle: string, workCoverImage: string, status: ClientStatus) => {
    setIsLoading(true);
    try {
      const payload = {
        title: workTitle,
        coverImage: workCoverImage || undefined,
        pages: pages.map((p) => ({
          type: p.contentType,
          content: p.contentJson,
        })),
        status: clientStatusToServer(status),
      };

      let savedWork: Work;
      if (currentWorkId) {
        savedWork = await workAPI.update({ id: currentWorkId, ...payload });
        toast.success('작품이 업데이트되었습니다');
      } else {
        savedWork = await workAPI.create(payload);
        setCurrentWorkId(savedWork.id);
        toast.success('작품이 저장되었습니다');
      }

      setTitle(savedWork.title);
      setCoverImage(savedWork.coverImage || '');
      setIsSaveDialogOpen(false);

      if (status === 'completed') {
        router.push('/dashboard/books');
      } else {
        router.push('/dashboard/workspace');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (pages.length === 0 || !title.trim()) return;

    try {
      const payload = {
        title: title || '제목 없는 작품',
        coverImage: coverImage || undefined,
        pages: pages.map((p) => ({
          type: p.contentType,
          content: p.contentJson,
        })),
        status: 'draft',
      };

      if (currentWorkId) {
        await workAPI.update({ id: currentWorkId, ...payload });
      } else {
        const saved = await workAPI.create(payload);
        setCurrentWorkId(saved.id);
      }
    } catch (error) {
      console.warn('Auto-save error:', error);
    }
  }, [pages, title, coverImage, currentWorkId]);

  useEffect(() => {
    const interval = window.setInterval(autoSave, 3 * 60 * 1000); // 3 minutes
    return () => window.clearInterval(interval);
  }, [autoSave]);

  // Export and share handlers
  const handleExportPDF = () => toast.info('PDF 내보내기 기능이 곧 지원됩니다');
  const handleShare = () => toast.info('공유 기능이 곧 지원됩니다');

  const selectedPage = selectedPageId ? pages.find((p) => p.id === selectedPageId) ?? null : null;

  if (isBootLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">편집기를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  const headerOrientation: 'portrait' | 'landscape' =
    selectedPage?.contentJson.orientation ?? 'portrait';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>
            <h1 className="text-xl font-semibold">작품 만들기</h1>
            {currentWorkId && <Badge variant="secondary">자동저장됨</Badge>}
          </div>

          <div className="flex items-center gap-3">
            {/* 캔버스 방향 (헤더) */}
                        <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">캔버스 방향</span>
              <Select
                value={headerOrientation}
                onValueChange={(value: string) => {
                  if (!selectedPage) return;
                  const orientation = value as 'portrait' | 'landscape';
                  updatePageContent(selectedPage.id, { orientation });
                }}
                disabled={!selectedPage}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="세로/가로" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">세로 (Portrait)</SelectItem>
                  <SelectItem value="landscape">가로 (Landscape)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewDialogOpen(true)}
              disabled={pages.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              미리보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={pages.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF 내보내기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={pages.length === 0}
            >
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              disabled={pages.length === 0 || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Left Panel - Page List */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">페이지</h2>
              <Badge variant="secondary">{pages.length}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPage('text')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Type className="w-4 h-4" />
                <span className="text-xs">텍스트</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPage('image')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs">이미지</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPage('mixed')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs">혼합</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {pages.map((page, index) => {
              const thumbOri: 'portrait' | 'landscape' = page.contentJson.orientation ?? 'portrait';
              const thumbAspect = thumbOri === 'landscape' ? 4 / 3 : 3 / 4; // 숫자로!

              return (
                <Card
                  key={page.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPageId === page.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPageId(page.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">페이지 {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(page.id, 'up');
                          }}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                          aria-label="move-up"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(page.id, 'down');
                          }}
                          disabled={index === pages.length - 1}
                          className="h-6 w-6 p-0"
                          aria-label="move-down"
                        >
                          ↓
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      {page.contentType === 'text' && '텍스트'}
                      {page.contentType === 'image' && '이미지'}
                      {page.contentType === 'mixed' && '텍스트+이미지'}
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                        {thumbOri === 'landscape' ? '가로' : '세로'}
                      </span>
                    </div>

                    {/* 썸네일 */}
                    <div
                      className="w-full bg-gray-100 rounded border overflow-hidden"
                      style={{ aspectRatio: thumbAspect }}
                    >
                      {page.contentJson.imageUrl ? (
                        <img src={page.contentJson.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          {page.contentType === 'image' ? '이미지' : '미리보기'}
                        </div>
                      )}
                    </div>

                    {/* 하단 액션 */}
                    <div className="flex items-center gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicatePage(page.id);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPageToDelete(page.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Center Editor */}
        <div className="flex-1 flex flex-col">
          {selectedPage ? (
            <>
              {/* Toolbar */}
              <div className="bg-white border-b p-4">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">내용</TabsTrigger>
                    <TabsTrigger value="style">스타일</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="mt-4 space-y-4">
                    {(selectedPage.contentType === 'image' || selectedPage.contentType === 'mixed') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">이미지</label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Plus className="w-4 h-4 mr-2" /> 이미지 추가
                          </Button>
                          {selectedPage.contentJson.imageUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startImageEdit(selectedPage.contentJson.imageUrl as string)}
                            >
                              <Edit className="w-4 h-4 mr-2" /> 편집
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}

                    {(selectedPage.contentType === 'text' || selectedPage.contentType === 'mixed') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">텍스트</label>
                        <Textarea
                          value={selectedPage.contentJson.text || ''}
                          onChange={(e) => updatePageContent(selectedPage.id, { text: e.target.value })}
                          placeholder="텍스트를 입력하세요"
                          rows={4}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="style" className="mt-4 space-y-6">
                    {/* 페이지 텍스트/이미지 스타일들 */}
                    {(selectedPage.contentType === 'text' || selectedPage.contentType === 'mixed') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">폰트</label>
                          <Select
                            value={selectedPage.contentJson.fontFamily || '나눔스퀘어'}
                            onValueChange={(v) => updatePageContent(selectedPage.id, { fontFamily: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="나눔스퀘어">나눔스퀘어</SelectItem>
                              <SelectItem value="나눔고딕">나눔고딕</SelectItem>
                              <SelectItem value="맑은 고딕">맑은 고딕</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">크기</label>
                          <Select
                            value={(selectedPage.contentJson.fontSize || 16).toString()}
                            onValueChange={(v) => updatePageContent(selectedPage.id, { fontSize: Number(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12px</SelectItem>
                              <SelectItem value="14">14px</SelectItem>
                              <SelectItem value="16">16px</SelectItem>
                              <SelectItem value="18">18px</SelectItem>
                              <SelectItem value="20">20px</SelectItem>
                              <SelectItem value="24">24px</SelectItem>
                              <SelectItem value="28">28px</SelectItem>
                              <SelectItem value="32">32px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">두께</label>
                          <Select
                            value={selectedPage.contentJson.fontWeight || 'normal'}
                            onValueChange={(v) => updatePageContent(selectedPage.id, { fontWeight: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">일반</SelectItem>
                              <SelectItem value="bold">굵게</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">정렬</label>
                          <Select
                            value={selectedPage.contentJson.textAlign || 'left'}
                            onValueChange={(v) =>
                              updatePageContent(selectedPage.id, { textAlign: v as 'left' | 'center' | 'right' })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">왼쪽 정렬</SelectItem>
                              <SelectItem value="center">가운데 정렬</SelectItem>
                              <SelectItem value="right">오른쪽 정렬</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">색상</label>
                          <Input
                            type="color"
                            value={selectedPage.contentJson.color || '#000000'}
                            onChange={(e) => updatePageContent(selectedPage.id, { color: e.target.value })}
                            className="h-10"
                          />
                        </div>
                      </div>
                    )}

                    {(selectedPage.contentType === 'image' || selectedPage.contentType === 'mixed') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">이미지 크기</label>
                          <Select
                            value={selectedPage.contentJson.imageSize || 'medium'}
                            onValueChange={(v) =>
                              updatePageContent(selectedPage.id, {
                                imageSize: v as 'small' | 'medium' | 'large' | 'full',
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">작게</SelectItem>
                              <SelectItem value="medium">보통</SelectItem>
                              <SelectItem value="large">크게</SelectItem>
                              <SelectItem value="full">전체</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedPage.contentType === 'mixed' && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">이미지 위치</label>
                            <Select
                              value={selectedPage.contentJson.imagePosition || 'top'}
                              onValueChange={(v) =>
                                updatePageContent(selectedPage.id, {
                                  imagePosition: v as 'top' | 'bottom' | 'left' | 'right',
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top">위</SelectItem>
                                <SelectItem value="bottom">아래</SelectItem>
                                <SelectItem value="left">왼쪽</SelectItem>
                                <SelectItem value="right">오른쪽</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Canvas Area */}
              {selectedPage && (() => {
                const ori: 'portrait' | 'landscape' = selectedPage.contentJson.orientation ?? 'portrait';
                const canvasWidth = ori === 'landscape' ? 1100 : 800;
                const aspect = ori === 'landscape' ? 4 / 3 : 3 / 4; // 숫자로!

                return (
                  <div className="flex-1 p-6 overflow-auto">
                    <div className="max-w-full mx-auto">
                      <div
                        key={`${selectedPage.id}-${ori}`} // 방향 변경 시 리마운트
                        className="relative bg-white border rounded-xl shadow-sm overflow-hidden mx-auto"
                        style={{ width: canvasWidth, maxWidth: '100%', aspectRatio: aspect }}
                      >
                        <div className="absolute inset-0">
                          <Card className="h-full w-full bg-transparent border-0 shadow-none">
                            <CardContent className="h-full w-full p-8 overflow-auto">
                              {selectedPage.contentType === 'mixed' ? (
                                <div
                                  className={`space-y-4 ${
                                    selectedPage.contentJson.imagePosition === 'left' ||
                                    selectedPage.contentJson.imagePosition === 'right'
                                      ? 'flex gap-4 items-start'
                                      : ''
                                  }`}
                                >
                                  {selectedPage.contentJson.imageUrl && (
                                    <div
                                      className={`
                                        ${selectedPage.contentJson.imagePosition === 'top' ? 'order-1' : ''}
                                        ${selectedPage.contentJson.imagePosition === 'bottom' ? 'order-2' : ''}
                                        ${selectedPage.contentJson.imagePosition === 'left' ? 'order-1 flex-shrink-0' : ''}
                                        ${selectedPage.contentJson.imagePosition === 'right' ? 'order-2 flex-shrink-0' : ''}
                                        ${selectedPage.contentJson.imageSize === 'small' ? 'w-32 h-32' : ''}
                                        ${selectedPage.contentJson.imageSize === 'medium' ? 'w-48 h-48' : ''}
                                        ${selectedPage.contentJson.imageSize === 'large' ? 'w-64 h-64' : ''}
                                        ${selectedPage.contentJson.imageSize === 'full' ? 'w-full' : ''}
                                      `}
                                    >
                                      <img
                                        src={selectedPage.contentJson.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => startImageEdit(selectedPage.contentJson.imageUrl as string)}
                                      />
                                    </div>
                                  )}

                                  {selectedPage.contentJson.text && (
                                    <div
                                      className={`
                                        ${selectedPage.contentJson.imagePosition === 'top' ? 'order-2' : ''}
                                        ${selectedPage.contentJson.imagePosition === 'bottom' ? 'order-1' : ''}
                                        ${selectedPage.contentJson.imagePosition === 'left' ? 'order-2 flex-1' : ''}
                                        ${selectedPage.contentJson.imagePosition === 'right' ? 'order-1 flex-1' : ''}
                                      `}
                                      style={{
                                        fontSize: `${selectedPage.contentJson.fontSize || 16}px`,
                                        fontFamily: selectedPage.contentJson.fontFamily || 'inherit',
                                        fontWeight: selectedPage.contentJson.fontWeight || 'normal',
                                        color: selectedPage.contentJson.color || 'inherit',
                                        textAlign: selectedPage.contentJson.textAlign || 'left',
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      {selectedPage.contentJson.text}
                                    </div>
                                  )}
                                </div>
                              ) : selectedPage.contentType === 'image' ? (
                                selectedPage.contentJson.imageUrl ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <img
                                      src={selectedPage.contentJson.imageUrl}
                                      alt=""
                                      className={`
                                        rounded cursor-pointer hover:opacity-80 transition-opacity
                                        ${selectedPage.contentJson.imageSize === 'small' ? 'max-w-xs' : ''}
                                        ${selectedPage.contentJson.imageSize === 'medium' ? 'max-w-md' : ''}
                                        ${selectedPage.contentJson.imageSize === 'large' ? 'max-w-lg' : ''}
                                        ${selectedPage.contentJson.imageSize === 'full' ? 'w-full' : ''}
                                      `}
                                      onClick={() => startImageEdit(selectedPage.contentJson.imageUrl as string)}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                      <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                                      <p>이미지를 추가해주세요</p>
                                    </div>
                                  </div>
                                )
                              ) : selectedPage.contentJson.text ? (
                                <div
                                  style={{
                                    fontSize: `${selectedPage.contentJson.fontSize || 16}px`,
                                    fontFamily: selectedPage.contentJson.fontFamily || 'inherit',
                                    fontWeight: selectedPage.contentJson.fontWeight || 'normal',
                                    color: selectedPage.contentJson.color || 'inherit',
                                    textAlign: selectedPage.contentJson.textAlign || 'left',
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {selectedPage.contentJson.text}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                  <div className="text-center">
                                    <Type className="w-16 h-16 mx-auto mb-4" />
                                    <p>텍스트를 입력해주세요</p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Plus className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg mb-2">새 페이지를 추가해주세요</p>
                <p className="text-sm">왼쪽 패널에서 페이지 유형을 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {isImageEditorOpen && (
        <ImageEditor
          src={editingImageSrc}
          alt="편집할 이미지"
          onSave={handleImageEditSave}
          onCancel={() => setIsImageEditorOpen(false)}
        />
      )}

      <SaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSave}
        currentTitle={title}
        currentCoverImage={coverImage}
        isLoading={isLoading}
        initialStatus={initialStatus}
      />

      <PreviewDialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        pages={pages}
        title={title || '제목 없음'}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>페이지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 페이지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPageToDelete(null)}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pageToDelete && deletePage(pageToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

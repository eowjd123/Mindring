"use client";

import React, { useState, useRef, useEffect } from "react";
import { Home, RotateCcw, Download, Palette, Image as ImageIcon, Undo2, Redo2, Eraser, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";


// 색상 팔레트 (시니어 친화적인 밝고 명확한 색상)
const COLOR_PALETTE = [
  { name: "빨강", color: "#FF6B6B", hex: "#FF6B6B" },
  { name: "주황", color: "#FFA500", hex: "#FFA500" },
  { name: "노랑", color: "#FFD93D", hex: "#FFD93D" },
  { name: "연두", color: "#95E1D3", hex: "#95E1D3" },
  { name: "초록", color: "#6BCB77", hex: "#6BCB77" },
  { name: "하늘", color: "#4ECDC4", hex: "#4ECDC4" },
  { name: "파랑", color: "#4D96FF", hex: "#4D96FF" },
  { name: "남색", color: "#5B7DB8", hex: "#5B7DB8" },
  { name: "보라", color: "#9B59B6", hex: "#9B59B6" },
  { name: "분홍", color: "#FF9FF3", hex: "#FF9FF3" },
  { name: "갈색", color: "#8B4513", hex: "#8B4513" },
  { name: "검정", color: "#2C3E50", hex: "#2C3E50" },
];

// 도안 타입 정의
interface ColoringTemplate {
  id: string;
  name: string;
  groupId?: string;
  groupName?: string;
  original: string;
  outline: string;
  palette?: Array<{ name: string; hex: string }>;
}

interface ColoringGroup {
  id: string;
  name: string;
  description?: string;
}

export default function ColoringPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outlineImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ColoringTemplate | null>(null);
  const [currentPalette, setCurrentPalette] = useState<Array<{ name: string; hex: string }>>(COLOR_PALETTE);
  const [adminPalette, setAdminPalette] = useState<Array<{ name: string; hex: string }>>([]); // 관리자가 지정한 색상만 따로 저장
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_PALETTE[0].hex);
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);
  const [groups, setGroups] = useState<ColoringGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [outlineImage, setOutlineImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fillMode, setFillMode] = useState(true); // true: 영역 채우기, false: 브러시 모드
  const [isEraserMode, setIsEraserMode] = useState(false); // 지우개 모드
  const [brushSize, setBrushSize] = useState(30); // 큰 브러시 크기 (시니어 친화적)
  const [outlineImageData, setOutlineImageData] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]); // Undo 히스토리
  const [historyIndex, setHistoryIndex] = useState(-1); // 현재 히스토리 인덱스
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // 마우스 위치 (브러시 프리뷰용)

  // 도안 및 그룹 데이터 로드
  useEffect(() => {
    fetchTemplatesAndGroups();
  }, []);

  const fetchTemplatesAndGroups = async () => {
    try {
      setLoading(true);
      const [templatesRes, groupsRes] = await Promise.all([
        fetch("/api/coloring/templates"),
        fetch("/api/coloring/groups"),
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

  // Canvas 초기화 및 도안 로드
  useEffect(() => {
    if (outlineImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Canvas 크기를 이미지에 맞춤
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 흰색 배경
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 도안 이미지 그리기 (윤곽선)
        ctx.drawImage(img, 0, 0);
        
        // 원본 윤곽선 이미지 데이터 저장 (브러시 모드에서 윤곽선 체크용)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setOutlineImageData(imageData);
        
        // 초기 상태를 히스토리에 저장
        const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialState]);
        setHistoryIndex(0);
        
        outlineImageRef.current = img;
      };
      img.src = outlineImage;
    }
  }, [outlineImage]);

  // Flood Fill 알고리즘 (영역 채우기) - 테두리까지 깔끔하게 채우기
  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: string,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (!outlineImageData) return;
    
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    const outlineData = outlineImageData.data;
    
    const startXInt = Math.floor(startX);
    const startYInt = Math.floor(startY);
    const startPos = (startYInt * canvasWidth + startXInt) * 4;
    
    // 시작 픽셀의 색상 (RGBA)
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];
    
    // 채울 색상 (RGB)
    const fillR = parseInt(fillColor.substring(1, 3), 16);
    const fillG = parseInt(fillColor.substring(3, 5), 16);
    const fillB = parseInt(fillColor.substring(5, 7), 16);
    
    // 이미 같은 색이면 리턴
    if (startR === fillR && startG === fillG && startB === fillB) {
      return;
    }
    
    // 시작 위치가 윤곽선이면 리턴
    if (isOutlinePixel(outlineImageData, startXInt, startYInt, canvasWidth)) {
      return;
    }
    
    // 색상 비교 함수 - 경계선까지 완벽하게 채우기 (매우 적극적)
    const isFillableColor = (pos: number, x: number, y: number) => {
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];
      
      // 알파 값이 너무 낮으면 스킵
      if (a < 20) return false;
      
      // 이미 채워진 색이면 스킵
      if (r === fillR && g === fillG && b === fillB) return false;
      
      // 원본 윤곽선 이미지에서 해당 위치 확인
      const outlineIndex = pos;
      const outlineR = outlineData[outlineIndex];
      const outlineG = outlineData[outlineIndex + 1];
      const outlineB = outlineData[outlineIndex + 2];
      const outlineA = outlineData[outlineIndex + 3];
      
      // 원본 이미지에서 순수 검은색 윤곽선만 제외
      // 매우 엄격한 기준: RGB 모두 50 이하만 윤곽선으로 판단
      const isPureBlackOutline = outlineA > 20 && outlineR <= 50 && outlineG <= 50 && outlineB <= 50;
      if (isPureBlackOutline) {
        return false;
      }
      
      // 원본 이미지가 순수 검은색이 아니면 모두 채울 수 있음
      // (경계선 근처의 밝은 픽셀, 회색 픽셀 모두 포함)
      if (!isPureBlackOutline) {
        // 현재 픽셀이 너무 어두운 색(거의 검은색)이 아니면 채우기
        const isCurrentVeryDark = r <= 50 && g <= 50 && b <= 50;
        if (!isCurrentVeryDark) {
          return true;
        }
      }
      
      // 흰색 배경 또는 밝은 색상 영역인지 확인
      const diffR = Math.abs(r - startR);
      const diffG = Math.abs(g - startG);
      const diffB = Math.abs(b - startB);
      const totalDiff = diffR + diffG + diffB;
      
      // 흰색 배경의 경우 매우 넓은 범위 허용
      const isWhite = startR > 150 && startG > 150 && startB > 150;
      const threshold = isWhite ? 150 : 100; // 임계값 대폭 증가
      
      // 차이가 작으면 같은 색으로 간주
      if (totalDiff < threshold) {
        return true;
      }
      
      // 현재 픽셀이 밝은 색이면 무조건 채울 수 있음 (경계선 근처 처리)
      const isCurrentBright = r > 80 || g > 80 || b > 80;
      if (isCurrentBright && !isPureBlackOutline) {
        return true;
      }
      
      return false;
    };
    
    // 큐를 사용한 BFS 방식 flood fill
    const queue: Array<[number, number]> = [[startXInt, startYInt]];
    const visited = new Set<string>();
    
    const getPixelKey = (x: number, y: number) => `${x},${y}`;
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = getPixelKey(x, y);
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;
      
      const pos = (y * canvasWidth + x) * 4;
      
      // 채울 수 있는 색상인지 확인
      if (!isFillableColor(pos, x, y)) continue;
      
      visited.add(key);
      
      // 픽셀 색상 변경
      data[pos] = fillR;
      data[pos + 1] = fillG;
      data[pos + 2] = fillB;
      data[pos + 3] = 255; // 알파는 불투명
      
      // 인접 픽셀 추가 (4방향)
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
    
    // 변경된 이미지 데이터를 캔버스에 적용
    ctx.putImageData(imageData, 0, 0);
  };

  // Canvas 상태를 히스토리에 저장
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    
    // 히스토리 크기 제한 (최대 50개)
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  };

  // Undo 기능
  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  // Redo 기능
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  // 색칠하기 함수 (영역 채우기)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 작업 전 상태 저장
    saveToHistory();

    // Flood Fill로 영역 채우기
    const fillColor = isEraserMode ? "#FFFFFF" : selectedColor;
    floodFill(ctx, x, y, fillColor, canvas.width, canvas.height);
  };

  // 픽셀이 윤곽선(검은색)인지 확인하는 함수 - 매우 엄격한 버전
  const isOutlinePixel = (imageData: ImageData, x: number, y: number, width: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= imageData.height) return true;
    
    const index = (y * width + x) * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const a = imageData.data[index + 3];
    
    // 투명한 경우는 윤곽선으로 간주
    if (a < 30) return true;
    
    // 검은색(윤곽선) 판단: RGB 값이 모두 매우 낮은 경우
    // 순수 검은색만 윤곽선으로 판단 (RGB 모두 50 이하)
    // 이렇게 하면 안티앨리어싱된 회색 픽셀은 윤곽선이 아닌 것으로 처리
    const isPureBlack = r <= 50 && g <= 50 && b <= 50;
    
    return isPureBlack;
  };

  // 브러시 모드 색칠하기 함수 (윤곽선을 넘지 않도록)
  const handleBrushPaint = (e: React.MouseEvent<HTMLCanvasElement>, isFirstPaint: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !outlineImageData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 첫 번째 브러시 그리기일 때만 히스토리 저장
    if (isFirstPaint) {
      saveToHistory();
    }

    // 브러시 크기만큼의 원형 영역을 확인하며 색칠
    const radius = brushSize;
    const minX = Math.max(0, x - radius);
    const maxX = Math.min(canvas.width - 1, x + radius);
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(canvas.height - 1, y + radius);

    // 현재 canvas의 이미지 데이터 가져오기
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = currentImageData.data;
    
    // 색칠할 색상 (RGB) - 지우개 모드면 흰색
    const fillColor = isEraserMode ? "#FFFFFF" : selectedColor;
    const fillR = parseInt(fillColor.substring(1, 3), 16);
    const fillG = parseInt(fillColor.substring(3, 5), 16);
    const fillB = parseInt(fillColor.substring(5, 7), 16);

    // 브러시 영역 내의 각 픽셀 확인
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = px - x;
        const dy = py - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 브러시 반경 내에 있고, 윤곽선이 아닌 경우에만 색칠
        if (distance <= radius) {
          // 원본 윤곽선 이미지에서 해당 픽셀이 윤곽선인지 확인
          if (!isOutlinePixel(outlineImageData, px, py, canvas.width)) {
            const index = (py * canvas.width + px) * 4;
            data[index] = fillR;
            data[index + 1] = fillG;
            data[index + 2] = fillB;
            data[index + 3] = 255; // 알파는 불투명
          }
        }
      }
    }

    // 변경된 이미지 데이터를 canvas에 적용
    ctx.putImageData(currentImageData, 0, 0);
  };

  // 드래그로 색칠하기
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (fillMode) {
      // 영역 채우기 모드: 클릭만
      handleCanvasClick(e);
    } else {
      // 브러시 모드: 드래그 가능
      setIsDrawing(true);
      handleBrushPaint(e, true); // 첫 번째 그리기
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (!isDrawing || fillMode) return;
    handleBrushPaint(e, false); // 연속 그리기
  };

  const handleCanvasMouseLeave = () => {
    setMousePosition(null);
    setIsDrawing(false);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // 터치 이벤트 지원 (모바일)
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const handleCanvasTouchEnd = () => {
    setIsDrawing(false);
  };

  // 초기화
  const handleReset = () => {
    if (outlineImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx || !outlineImageRef.current) return;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(outlineImageRef.current, 0, 0);
      
      // 초기 상태를 히스토리에 저장
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  };

  // 이미지 다운로드
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    try {
      // 고해상도로 다운로드
      const scale = 2; // 2배 해상도
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      const tempCtx = tempCanvas.getContext("2d");
      
      if (!tempCtx) return;
      
      // 고해상도로 그리기
      tempCtx.scale(scale, scale);
      tempCtx.drawImage(canvas, 0, 0);
      
      // PNG로 다운로드
      const link = document.createElement("a");
      link.download = `${selectedTemplate.name}-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      // 기본 다운로드로 폴백
      const link = document.createElement("a");
      link.download = `coloring-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    }
  };

  // 프린트 기능
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    try {
      // Canvas를 이미지로 변환
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      
      // 새 창 열기
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
        return;
      }

      // 프린트용 HTML 작성
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${selectedTemplate.name} - 색칠 도안</title>
            <style>
              @media print {
                @page {
                  margin: 0;
                  size: auto;
                }
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: white;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
              }
              @media screen {
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f5f5f5;
                }
                img {
                  max-width: 100%;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="${selectedTemplate.name} 색칠 도안" />
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print failed:", error);
      alert("프린트 중 오류가 발생했습니다.");
    }
  };

  // 도안 선택
  const handleSelectTemplate = (template: ColoringTemplate) => {
    setSelectedTemplate(template);
    setOutlineImage(template.outline);
    setOriginalImage(template.original);
    
    // 관리자가 지정한 색상이 있으면 저장 (중복 제거)
    let adminColors: Array<{ name: string; hex: string }> = [];
    
    if (template.palette && template.palette.length > 0) {
      template.palette.forEach((adminColor) => {
        // 기본 색상과 중복되지 않는 관리자 색상만 추가
        const isDuplicate = COLOR_PALETTE.some(
          (color) => color.hex.toUpperCase() === adminColor.hex.toUpperCase()
        );
        if (!isDuplicate) {
          adminColors.push(adminColor);
        }
      });
    }
    
    setAdminPalette(adminColors);
    
    // 기본 색상과 관리자 색상을 합쳐서 전체 팔레트 생성
    const mergedPalette = [...COLOR_PALETTE, ...adminColors];
    setCurrentPalette(mergedPalette);
    setSelectedColor(mergedPalette[0].hex);
  };

  // 그룹별 필터링된 도안 목록
  const filteredTemplates = templates.filter((template) => {
    if (selectedGroup === "all") return true;
    return template.groupId === selectedGroup;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              마음색칠
            </h1>
            <p className="mt-2 text-gray-600 text-sm">도안을 선택하고 색을 칠해보세요</p>
          </div>
          <div className="flex gap-2">
            {selectedTemplate && (
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setOutlineImage(null);
                  setOriginalImage(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md text-sm font-medium border border-gray-200"
              >
                <ImageIcon className="h-4 w-4" />
                <span>도안 변경</span>
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <Home className="h-4 w-4" />
              <span>홈으로</span>
            </Link>
          </div>
        </div>

        {/* 도안 선택 (도안이 선택되지 않은 경우) */}
        {!selectedTemplate && (
          <div className="space-y-6">
            {/* 그룹 선택 */}
            {groups.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  그룹 선택
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGroup("all")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedGroup === "all"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                    }`}
                  >
                    전체
                  </button>
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedGroup === group.id
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 도안 목록 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                </div>
                도안 선택
              </h2>
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                  <p className="mt-4 text-gray-500">로딩 중...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Palette className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {selectedGroup === "all"
                      ? "도안이 없습니다."
                      : "이 그룹에 도안이 없습니다."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="group bg-white hover:bg-indigo-50 rounded-xl p-4 transition-all duration-200 border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transform hover:-translate-y-1"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden shadow-inner">
                        <img
                          src={template.outline}
                          alt={template.name}
                          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).innerHTML = "🎨";
                          }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {template.name}
                      </p>
                      {template.groupName && (
                        <p className="text-xs text-gray-500 mt-1">{template.groupName}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 색칠하기 영역 */}
        {selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 색상 팔레트 */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sticky top-4">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                    <Palette className="h-5 w-5 text-indigo-600" />
                  </div>
                  색상 선택
                </h2>
                {currentPalette.length > 0 ? (
                  <>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-1 space-y-4">
                      {/* 기본 색상 섹션 */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-1 w-8 bg-indigo-400 rounded-full"></div>
                          <p className="text-xs font-semibold text-gray-600">기본 색상</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {COLOR_PALETTE.map((color, index) => (
                            <button
                              key={`default-${color.hex}-${index}`}
                              onClick={() => setSelectedColor(color.hex)}
                              className={`aspect-square rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                                selectedColor === color.hex
                                  ? "ring-4 ring-indigo-500 ring-offset-2 scale-110 z-10 relative"
                                  : "hover:scale-105 hover:ring-2 hover:ring-gray-300"
                              }`}
                              style={{ backgroundColor: color.hex }}
                              aria-label={color.name}
                              title={color.name}
                            >
                              {selectedColor === color.hex && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                                  </div>
                                </div>
                              )}
                              <span className="sr-only">{color.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 관리자가 지정한 색상 섹션 */}
                      {adminPalette.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-8 bg-purple-400 rounded-full"></div>
                            <p className="text-xs font-semibold text-gray-600">추천 색상</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {adminPalette.map((color, index) => (
                              <button
                                key={`admin-${color.hex}-${index}`}
                                onClick={() => setSelectedColor(color.hex)}
                                className={`aspect-square rounded-xl transition-all duration-200 shadow-md hover:shadow-lg relative ${
                                  selectedColor === color.hex
                                    ? "ring-4 ring-purple-500 ring-offset-2 scale-110 z-10"
                                    : "hover:scale-105 hover:ring-2 hover:ring-purple-300"
                                }`}
                                style={{ backgroundColor: color.hex }}
                                aria-label={color.name}
                                title={color.name}
                              >
                                {/* 관리자 색상 표시 */}
                                <div className="absolute top-1 right-1">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full border border-white shadow-sm"></div>
                                </div>
                                {selectedColor === color.hex && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                      <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                    </div>
                                  </div>
                                )}
                                <span className="sr-only">{color.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Palette className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">사용 가능한 색상이 없습니다.</p>
                  </div>
                )}

                {/* 모드 선택 */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    색칠 모드
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setFillMode(true);
                        setIsEraserMode(false);
                      }}
                      className={`px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                        fillMode && !isEraserMode
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                      }`}
                    >
                      영역 채우기
                    </button>
                    <button
                      onClick={() => {
                        setFillMode(false);
                        setIsEraserMode(false);
                      }}
                      className={`px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                        !fillMode && !isEraserMode
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                      }`}
                    >
                      브러시
                    </button>
                    <button
                      onClick={() => {
                        setFillMode(false);
                        setIsEraserMode(true);
                      }}
                      className={`px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 ${
                        isEraserMode
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                      }`}
                    >
                      <Eraser className="h-3.5 w-3.5" />
                      지우개
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    <p className="text-xs text-blue-800 text-center">
                      {isEraserMode
                        ? "✏️ 드래그하여 색을 지울 수 있습니다"
                        : fillMode
                        ? "🎯 클릭한 영역이 자동으로 채워집니다"
                        : "🖌️ 드래그하여 자유롭게 색을 칠하세요"}
                    </p>
                  </div>
                </div>

                {/* Undo/Redo 버튼 */}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className={`flex-1 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      historyIndex <= 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Undo2 className="h-4 w-4" />
                    <span>되돌리기</span>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className={`flex-1 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      historyIndex >= history.length - 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Redo2 className="h-4 w-4" />
                    <span>다시 실행</span>
                  </button>
                </div>

                {/* 브러시 크기 조절 (브러시 모드일 때만 표시) */}
                {!fillMode && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      브러시 크기
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="60"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      style={{
                        background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${((brushSize - 20) / 40) * 100}%, #E5E7EB ${((brushSize - 20) / 40) * 100}%, #E5E7EB 100%)`
                      }}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-600 font-medium">작게</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-full bg-indigo-600"
                          style={{
                            width: `${(brushSize / 60) * 24}px`,
                            height: `${(brushSize / 60) * 24}px`,
                            minWidth: '8px',
                            minHeight: '8px',
                          }}
                        />
                        <span className="text-xs font-semibold text-indigo-700 w-8 text-center">
                          {brushSize}px
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">크게</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 색칠하기 영역 */}
            <div className="lg:col-span-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">색칠하기</h2>
                    <p className="text-sm text-gray-600">{selectedTemplate.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm border border-gray-200 hover:shadow-md"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>다시 시작</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span>다운로드</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <Printer className="h-4 w-4" />
                      <span>프린트</span>
                    </button>
                  </div>
                </div>

                {/* 사용 안내 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-900 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span>
                      <strong>사용 방법:</strong> 왼쪽 원본을 참고하여 오른쪽 도안에 색상을 선택한 후{" "}
                      {fillMode
                        ? "도안의 영역을 클릭하면 자동으로 채워집니다."
                        : "도안을 클릭하거나 드래그하여 색을 칠하세요."}
                    </span>
                  </p>
                </div>

                {/* 원본과 도안 나란히 표시 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 왼쪽: 원본 이미지 (참고용) */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 shadow-inner">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="h-1 w-1 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-700">
                        원본 (참고용)
                      </h3>
                      <div className="h-1 w-1 bg-indigo-600 rounded-full"></div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
                      {originalImage ? (
                        <img
                          src={originalImage}
                          alt="원본 이미지"
                          className="w-full h-auto rounded-lg"
                          style={{ maxHeight: "60vh" }}
                        />
                      ) : (
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">원본 이미지</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 색칠할 도안 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 shadow-inner">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="h-1 w-1 bg-purple-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-700">
                        도안 (색칠하기)
                      </h3>
                      <div className="h-1 w-1 bg-purple-600 rounded-full"></div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border-3 border-indigo-400 shadow-lg overflow-auto relative">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseLeave}
                        onTouchStart={handleCanvasTouchStart}
                        onTouchMove={handleCanvasTouchMove}
                        onTouchEnd={handleCanvasTouchEnd}
                        className="max-w-full h-auto cursor-crosshair rounded-lg"
                        style={{
                          maxHeight: "60vh",
                          touchAction: "none",
                        }}
                      />
                      {/* 브러시 크기 프리뷰 */}
                      {!fillMode && mousePosition && canvasRef.current && (
                        (() => {
                          const canvas = canvasRef.current!;
                          const rect = canvas.getBoundingClientRect();
                          const scaleX = rect.width / canvas.width;
                          const scaleY = rect.height / canvas.height;
                          const previewSize = brushSize * 2 * Math.min(scaleX, scaleY);
                          
                          return (
                            <div
                              className="absolute pointer-events-none border-3 rounded-full animate-pulse"
                              style={{
                                left: `${mousePosition.x}px`,
                                top: `${mousePosition.y}px`,
                                width: `${previewSize}px`,
                                height: `${previewSize}px`,
                                transform: "translate(-50%, -50%)",
                                borderColor: isEraserMode ? "#EF4444" : "#6366F1",
                                borderStyle: "dashed",
                                opacity: 0.8,
                                zIndex: 10,
                                boxShadow: isEraserMode 
                                  ? "0 0 10px rgba(239, 68, 68, 0.5)"
                                  : "0 0 10px rgba(99, 102, 241, 0.5)",
                              }}
                            />
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* 도안 변경 */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setOutlineImage(null);
                      setOriginalImage(null);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-200 hover:underline"
                  >
                    ← 다른 도안 선택하기
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

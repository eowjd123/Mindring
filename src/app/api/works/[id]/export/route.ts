// app/api/works/[id]/export/route.ts

import { CoverType, InnerPaper, PageContentType, PaperSize } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 작품 타입 정의 (Prisma 스키마와 일치)
interface WorkForExport {
  workId: string;
  title: string;
  pages: Array<{
    pageId: string;
    workId: string;
    orderIndex: number;
    contentType: PageContentType;
    contentJson: unknown;
  }>;
  printSpec?: {
    specId: string;
    workId: string;
    paperSize: PaperSize;
    coverType: CoverType;
    innerPaper: InnerPaper;
    orientation: string | null;
    additionalOptions: unknown;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

// 작품 내보내기 (PDF, 이미지 등)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await params;
    const body = await req.json() as { format?: string };
    const format = body.format || 'pdf'; // 기본값은 PDF

    if (!workId) {
      return NextResponse.json({ error: "Work ID is required" }, { status: 400 });
    }

    console.log('내보내기 요청:', workId, '형식:', format);

    // 작품 존재 및 소유자 확인
    const work = await prisma.work.findFirst({
      where: {
        workId: workId,
        userId: me.userId
      },
      include: {
        pages: {
          orderBy: { orderIndex: "asc" }
        },
        printSpec: true
      }
    });

    if (!work) {
      return NextResponse.json({ 
        error: "Work not found or unauthorized" 
      }, { status: 404 });
    }

    // 여기서는 간단한 PDF 생성 시뮬레이션
    // 실제로는 PDF 생성 라이브러리 (예: puppeteer, jsPDF 등)를 사용해야 합니다
    
    if (format === 'pdf') {
      // PDF 생성 로직 (임시)
      const pdfContentString = generateSimplePDF(work as WorkForExport);
      
      // 내보내기 기록 저장 (향후 사용 예정)
      await prisma.export.create({
        data: {
          workId: workId,
          fileType: 'PDF',
          filePath: `/exports/${workId}_${Date.now()}.pdf`,
        }
      });

      // PDF 응답 - 문자열을 직접 사용
      return new Response(pdfContentString, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(work.title)}.pdf"`,
        },
      });
    }

    return NextResponse.json({ 
      error: "Unsupported format" 
    }, { status: 400 });

  } catch (err) {
    console.error("Export work error:", err);
    return NextResponse.json({ 
      error: "Failed to export work" 
    }, { status: 500 });
  }
}

// 간단한 PDF 생성 함수 (실제로는 더 복잡한 라이브러리 사용)
function generateSimplePDF(work: WorkForExport): string {
  // 이것은 매우 간단한 예시입니다
  // 실제로는 puppeteer나 jsPDF 같은 라이브러리를 사용해야 합니다
  
  const pdfHeader = "%PDF-1.4\n";
  
  // 안전한 제목 처리 (특수 문자 제거)
  const safeTitle = work.title.replace(/[()]/g, '');
  
  const pdfContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${safeTitle.length + 50}
>>
stream
BT
/F1 24 Tf
100 700 Td
(${safeTitle}) Tj
BT
/F1 12 Tf
100 650 Td
(Pages: ${work.pages.length}) Tj
${work.printSpec ? `
BT
/F1 12 Tf
100 620 Td
(Paper: ${work.printSpec.paperSize}) Tj
` : ''}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000565 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;

  return pdfHeader + pdfContent;
}
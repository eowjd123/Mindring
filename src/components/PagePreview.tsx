'use client'


import { Page } from '@/lib/types'
import { Image as ImageIcon, Plus, Type } from 'lucide-react'


export default function PagePreview({ page }: { page: Page }) {
const imageStyle = page.content.imageStyle
const textStyle = page.content.textStyle


return (
<div className="w-full h-full flex flex-col relative overflow-hidden">
{/* Image Content */}
{page.content.image && (
<div className={`${page.type === 'mixed' ? 'flex-1' : 'w-full h-full'} flex items-center justify-center bg-gray-100`}>
<img
src={page.content.image}
alt="Page content"
className="max-w-full max-h-full object-contain"
style={{
transform: `rotate(${imageStyle?.rotation || 0}deg) scaleX(${imageStyle?.flipH ? -1 : 1}) scaleY(${imageStyle?.flipV ? -1 : 1})`
}}
/>
</div>
)}


{/* Text Content */}
{page.content.text && (
<div className={`${page.type === 'mixed' ? 'flex-1' : 'w-full h-full'} p-3 flex items-center`}>
<p
className="w-full line-clamp-6 text-xs"
style={{
fontSize: Math.min(page.content.textStyle?.fontSize || 16, 16),
color: textStyle?.color || '#000000',
textAlign: textStyle?.align || 'left',
fontWeight: textStyle?.bold ? 'bold' as const : 'normal',
fontStyle: textStyle?.italic ? 'italic' : 'normal'
}}
>
{page.content.text}
</p>
</div>
)}


{/* Empty State */}
{!page.content.image && !page.content.text && (
<div className="w-full h-full flex items-center justify-center bg-gray-100">
<div className="text-center text-gray-400">
{page.type === 'image' && <ImageIcon className="mx-auto h-8 w-8 mb-2" />}
{page.type === 'text' && <Type className="mx-auto h-8 w-8 mb-2" />}
{page.type === 'mixed' && <Plus className="mx-auto h-8 w-8 mb-2" />}
<p className="text-xs">
{page.type === 'image' ? '이미지 없음' : page.type === 'text' ? '텍스트 없음' : '내용 없음'}
</p>
</div>
</div>
)}
</div>
)
}
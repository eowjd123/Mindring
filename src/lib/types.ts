export type Align = 'left' | 'center' | 'right'


export interface ImageStyle {
width: number
height: number
rotation: number
flipH: boolean
flipV: boolean
}


export interface TextStyle {
fontSize: number
fontFamily: string
color: string
align: Align
bold: boolean
italic: boolean
}


export interface Page {
id: string
type: 'text' | 'image' | 'mixed'
content: {
text?: string
image?: string
imageStyle?: ImageStyle
textStyle?: TextStyle
}
}


export interface Work {
id: string
title: string
coverImage?: string
pages: Page[]
createdAt: string // ISO
updatedAt: string // ISO
}
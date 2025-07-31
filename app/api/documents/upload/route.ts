import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // ファイルの内容をバッファとして取得
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // public/documentsディレクトリに保存
    const documentsDir = join(process.cwd(), 'public', 'documents')
    
    // ディレクトリが存在しない場合は作成
    try {
      await mkdir(documentsDir, { recursive: true })
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }

    // ファイル名を安全にする（スペースをアンダースコアに変換）
    const safeFileName = file.name.replace(/\s+/g, '_')
    const filePath = join(documentsDir, safeFileName)

    // ファイルを保存
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      filename: safeFileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('ファイルアップロードエラー:', error)
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
} 
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * 使用系统 pdftoppm 工具将 PDF 每页渲染为 PNG 图片。
 *
 * 要求：
 * - 需要在系统中安装 Poppler，并保证 `pdftoppm` 命令在 PATH 中可用。
 *   - Windows 安装 Poppler 后，将其 bin 目录加入环境变量 PATH。
 *
 * 返回值：
 * - 一个字符串数组，每个元素是对应页的公开 URL，例如：
 *   /uploads/notes/<noteId>/page-1.png
 */
export async function convertPdfToImages(
  pdfTempPath: string,
  noteId: string
): Promise<string[]> {
  const uploadsRoot = path.join(__dirname, '../../uploads');
  const noteDir = path.join(uploadsRoot, 'notes', noteId);

  // 确保目录存在
  fs.mkdirSync(noteDir, { recursive: true });

  // 将上传的临时 PDF 移动到 note 目录
  const targetPdfPath = path.join(noteDir, 'original.pdf');
  await fs.promises.rename(pdfTempPath, targetPdfPath);

  // 使用 pdftoppm 将 PDF 转为 PNG：page-1.png, page-2.png, ...
  const outputPrefix = path.join(noteDir, 'page');

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('pdftoppm', ['-png', targetPdfPath, outputPrefix]);

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      reject(err);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pdftoppm exited with code ${code}: ${stderr}`));
      } else {
        resolve();
      }
    });
  });

  // 收集生成的 PNG 文件列表（page-1.png, page-2.png, ...）
  const files = await fs.promises.readdir(noteDir);
  const pageFiles = files
    .filter((f) => /^page-\d+\.png$/i.test(f))
    .sort((a, b) => {
      const getIndex = (name: string) => {
        const match = name.match(/^page-(\d+)\.png$/i);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getIndex(a) - getIndex(b);
    });

  // 转换为公开 URL
  const urls = pageFiles.map(
    (fileName) => `/uploads/notes/${noteId}/${fileName}`
  );

  // 如果没有生成任何 PNG，就至少返回原始 PDF 的 URL，方便调试
  if (urls.length === 0) {
    return [`/uploads/notes/${noteId}/original.pdf`];
  }

  return urls;
}


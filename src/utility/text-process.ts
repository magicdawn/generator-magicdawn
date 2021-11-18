/**
 * 移除多余的空行
 */

export const NEWLINE = '\n'

export function handleEmptyLines(content: string) {
  // 结尾的空行
  if (!content.endsWith(NEWLINE)) {
    content += NEWLINE
  }

  // 最多保留一个空行(两个连续的\n)
  content = content.replace(/\n{3,}/g, '\n\n')

  return content
}

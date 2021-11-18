/**
 * 获取最新版本
 */

import request from 'umi-request'

interface PkgInfo {
  [k: string]: any
  'dist-tags': {
    [k: string]: any
    latest: string
  }
}

/**
 * 获取一个包的最新版本
 */

export async function getLatestVersion(pkgname: string) {
  const res = (await request.get(`https://registry.npmmirror.com/${pkgname}`, {
    responseType: 'json',
  })) as PkgInfo
  return res?.['dist-tags'].latest
}
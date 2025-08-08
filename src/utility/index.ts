/**
 * 获取最新版本
 */

import request from 'got'
import pProps from 'p-props'

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
    resolveBodyOnly: true,
  })) as PkgInfo
  return res?.['dist-tags'].latest
}

export function toLatest(deps: Record<string, string>) {
  const input: Record<string, Promise<string>> = {}
  for (const key of Object.keys(deps)) {
    input[key] = getLatestVersion(key).then((version) => `^${version}`)
  }
  return pProps(input)
}

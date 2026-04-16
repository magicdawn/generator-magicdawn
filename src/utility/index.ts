/**
 * 获取最新版本
 */

import axios from 'axios'
import pProps from 'p-props'

export const request = axios.create({
  adapter: 'fetch',
})

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
  const registryNpmMirror = 'https://registry.npmmirror.com/'
  const registryTencentMirror = 'http://mirrors.tencent.com/npm/'
  const res = await request.get<PkgInfo>(`${registryNpmMirror}${pkgname}`)
  return res.data?.['dist-tags'].latest
}

export function toLatest(deps: Record<string, string>) {
  const input: Record<string, Promise<string>> = {}
  for (const key of Object.keys(deps)) {
    input[key] = getLatestVersion(key).then((version) => `^${version}`)
  }
  return pProps(input)
}

export function documentTitle(pageTitle: string | undefined, appName: string) {
  return pageTitle ? `${pageTitle} | ${appName}` : appName
}

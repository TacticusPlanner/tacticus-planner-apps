import type { IPublicClientApplication } from "@azure/msal-browser"

import { acquireApiAccessToken } from "@/shared/auth"

export class ApiHttpError extends Error {
  readonly response: Response
  readonly status: number

  constructor(message: string, status: number, response: Response) {
    super(message)
    this.name = "ApiHttpError"
    this.response = response
    this.status = status
  }
}

function getApiBaseUrl() {
  const value = import.meta.env.VITE_API_BASE_URL.trim()

  if (!value) {
    throw new Error("Missing required environment variable: VITE_API_BASE_URL")
  }

  return value
}

export async function fetchApi(
  msalInstance: IPublicClientApplication,
  path: string,
  init: RequestInit = {}
) {
  const accessToken = await acquireApiAccessToken(msalInstance)
  const headers = new Headers(init.headers)

  headers.set("Authorization", `Bearer ${accessToken}`)

  const response = await fetch(new URL(path, getApiBaseUrl()), {
    ...init,
    headers,
  })

  if (!response.ok && response.status !== 304) {
    throw new ApiHttpError(
      `API request failed with status ${response.status}.`,
      response.status,
      response
    )
  }

  return response
}

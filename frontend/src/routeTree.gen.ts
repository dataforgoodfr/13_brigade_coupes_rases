/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()
const ClearCuttingsMapLazyImport = createFileRoute('/clear-cuttings/map')()
const ClearCuttingsListLazyImport = createFileRoute('/clear-cuttings/list')()

// Create/Update Routes

const IndexLazyRoute = IndexLazyImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const ClearCuttingsMapLazyRoute = ClearCuttingsMapLazyImport.update({
  id: '/clear-cuttings/map',
  path: '/clear-cuttings/map',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/clear-cuttings.map.lazy').then((d) => d.Route),
)

const ClearCuttingsListLazyRoute = ClearCuttingsListLazyImport.update({
  id: '/clear-cuttings/list',
  path: '/clear-cuttings/list',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/clear-cuttings.list.lazy').then((d) => d.Route),
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/clear-cuttings/list': {
      id: '/clear-cuttings/list'
      path: '/clear-cuttings/list'
      fullPath: '/clear-cuttings/list'
      preLoaderRoute: typeof ClearCuttingsListLazyImport
      parentRoute: typeof rootRoute
    }
    '/clear-cuttings/map': {
      id: '/clear-cuttings/map'
      path: '/clear-cuttings/map'
      fullPath: '/clear-cuttings/map'
      preLoaderRoute: typeof ClearCuttingsMapLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/clear-cuttings/list': typeof ClearCuttingsListLazyRoute
  '/clear-cuttings/map': typeof ClearCuttingsMapLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/clear-cuttings/list': typeof ClearCuttingsListLazyRoute
  '/clear-cuttings/map': typeof ClearCuttingsMapLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/clear-cuttings/list': typeof ClearCuttingsListLazyRoute
  '/clear-cuttings/map': typeof ClearCuttingsMapLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/clear-cuttings/list' | '/clear-cuttings/map'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/clear-cuttings/list' | '/clear-cuttings/map'
  id: '__root__' | '/' | '/clear-cuttings/list' | '/clear-cuttings/map'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  ClearCuttingsListLazyRoute: typeof ClearCuttingsListLazyRoute
  ClearCuttingsMapLazyRoute: typeof ClearCuttingsMapLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  ClearCuttingsListLazyRoute: ClearCuttingsListLazyRoute,
  ClearCuttingsMapLazyRoute: ClearCuttingsMapLazyRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/clear-cuttings/list",
        "/clear-cuttings/map"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/clear-cuttings/list": {
      "filePath": "clear-cuttings.list.lazy.tsx"
    },
    "/clear-cuttings/map": {
      "filePath": "clear-cuttings.map.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */

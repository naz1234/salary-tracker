import { onRequest as __api___path___js_onRequest } from "/app/functions/api/[[path]].js"
import { onRequest as __api_index_js_onRequest } from "/app/functions/api/index.js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_index_js_onRequest],
    },
  ]
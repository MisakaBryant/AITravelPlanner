// This file is rendered at container start: docker-entrypoint.sh -> env.js
// Values come from container environment variables.
// Do NOT commit secrets here; they are substituted at runtime.
window.__ENV = {
  AMAP_KEY: "${AMAP_KEY}",
  AMAP_JS_KEY: "${AMAP_JS_KEY}",
  API_BASE: "${API_BASE}"
};

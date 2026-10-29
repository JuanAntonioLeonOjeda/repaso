# The study platform: built once, served as static files by nginx.
# Python for the exercises runs in the browser (Pyodide from the jsDelivr CDN, ADR-0002),
# so the image has no Python and no backend.

FROM node:24-alpine AS build
WORKDIR /app
# pnpm at the version the project is developed with (package.json "packageManager").
RUN npm install --global pnpm@12.11.2
# Dependencies first: this layer is rebuilt only when the lockfile changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# `pnpm build` checks the types first, then bundles (lessons are compiled from MDX here).
RUN pnpm build

# Not root, and nothing but nginx and the built files.
FROM nginxinc/nginx-unprivileged:1.31.2-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

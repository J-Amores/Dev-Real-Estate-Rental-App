# Portable fallback image (primary deploy target is Vercel — see .harness/deploy-plan.md).
# Builds the static Astro site and serves dist/ with nginx.
#
#   docker build -t mono-landing .
#   docker run -p 8080:80 mono-landing

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# pnpm via corepack (lockfileVersion 9 -> pnpm >= 9)
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- serve stage ----
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

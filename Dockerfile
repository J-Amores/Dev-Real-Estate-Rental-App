# Portable fallback image (primary deploy target is Vercel — see .harness/deploy-plan.md).
# Builds the static Astro site and serves dist/ with nginx.
#
#   docker build -t mono-landing .
#   docker run -p 8080:80 mono-landing

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

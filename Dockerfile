# Build stage - compile React + PWA jadi static files
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# .env.production harus sudah ada (lihat .env.example) sebelum build,
# karena Vite "mem-bake" VITE_* env var ke dalam file JS saat build, bukan saat runtime.
RUN npm run build

# Serve stage - nginx ringan, cuma sajikan static files hasil build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

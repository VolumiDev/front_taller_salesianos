# --- ETAPA 1: Construcción (Build) ---
FROM node:22-alpine3.22 AS build-step

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Compilamos la app
RUN npm run build -- --configuration production

# --- ETAPA 2: Ejecución (Run) ---
FROM nginx:alpine

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# --- LA CORRECCIÓN MAESTRA ---
# Apuntamos exactamente a la carpeta 'browser' dentro de 'front-taller'
COPY --from=build-step /app/dist/front-taller/browser /usr/share/nginx/html

EXPOSE 80
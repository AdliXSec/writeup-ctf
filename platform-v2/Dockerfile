# Stage 1: Build the React Application
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Hapus konfigurasi default nginx
RUN rm /etc/nginx/conf.d/default.conf
# Copy konfigurasi kustom nginx untuk React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy hasil build dari stage 1 ke nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:23-alpine3.21 as build-step

ARG VITE_API

COPY . . 
RUN npm i -g pnpm &&  pnpm i && pnpm  build    


#stage2
FROM nginx
COPY --from=build-step /app/public /usr/share/nginx/html

EXPOSE 80

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
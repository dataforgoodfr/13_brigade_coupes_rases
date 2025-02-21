FROM node:23-alpine3.21

ENV VITE_API="https://localhost/api"

COPY . . 
RUN npm i -g pnpm &&  pnpm i && pnpm tsc -b && pnpm vite build    

ENTRYPOINT [ "pnpm", "vite", "preview", "--host", "0.0.0.0" ]
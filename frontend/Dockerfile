FROM node:23-alpine3.21 as build-step

ARG VITE_API
ENV VITE_API=$VITE_API

WORKDIR /app
COPY . .
RUN npm i -g pnpm && pnpm i

EXPOSE 8000
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "8000"]
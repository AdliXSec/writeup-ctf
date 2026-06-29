FROM golang:1.22-bookworm AS build

WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o betorganizer cmd/server/main.go

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /app/betorganizer .
COPY --from=build /app/templates ./templates

RUN mkdir -p /opt/ad/state
RUN echo "LEEXY{betorganizer_toctou_ssti_39103}" > /flag.txt

ENV PORT=8140
EXPOSE 8140

CMD ["./betorganizer"]

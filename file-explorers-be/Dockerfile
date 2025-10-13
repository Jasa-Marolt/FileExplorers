FROM golang:1.25

WORKDIR /go/src/app

COPY . .

RUN go mod tidy
RUN go mod vendor
RUN go build -o /fe-backend .

CMD [ "/fe-backend" ] 
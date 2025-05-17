# Build stage
FROM golang:1.24-alpine AS builder

# Add metadata labels
LABEL maintainer="Walter Chavarria <wchavarria03@gmail.com>"
LABEL description="Transactions Processor - A CLI tool for processing transaction documents"
LABEL version="1.0.0"

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application with version information
ARG VERSION=dev
ARG BUILD_TIME=unknown
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s -X main.version=${VERSION} -X main.buildTime=${BUILD_TIME}" \
    -o transactions-processor ./cmd

# Final stage
FROM alpine:3.19

# Add metadata labels
LABEL maintainer="Walter Chavarria <wchavarria03@gmail.com>"
LABEL description="Transactions Processor - A CLI tool for processing transaction documents"
LABEL version="1.0.0"

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata && \
    update-ca-certificates

# Create non-root user with specific UID/GID
RUN addgroup -g 10001 appgroup && \
    adduser -D -u 10001 -G appgroup appuser

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/transactions-processor .

# Create necessary directories with proper permissions
RUN mkdir -p /app/input /app/output && \
    chown -R appuser:appgroup /app && \
    chmod 755 /app/transactions-processor

# Switch to non-root user
USER appuser

# Set environment variables
ENV PATH="/app:${PATH}" \
    TZ="UTC"

# Set default command
ENTRYPOINT ["transactions-processor"]

# Default command (can be overridden)
CMD ["--help"] 

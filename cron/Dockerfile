FROM alpine:latest

# Install curl for making HTTP requests
RUN apk add --no-cache curl

# Copy the script
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Run the script
CMD ["/run.sh"]

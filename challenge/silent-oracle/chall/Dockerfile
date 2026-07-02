FROM node:20

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Set environment variables
ENV PORT=8170

# Expose port
EXPOSE 8170

# Start server
CMD ["node", "server.js"]

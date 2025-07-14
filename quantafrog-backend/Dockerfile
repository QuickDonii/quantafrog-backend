# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Expose port (match your server.js PORT)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]

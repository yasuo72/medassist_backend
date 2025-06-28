FROM node:18-slim

WORKDIR /app

# Install system dependencies (Poppler for pdftoppm)
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils && rm -rf /var/lib/apt/lists/*

# Install node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build phase
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

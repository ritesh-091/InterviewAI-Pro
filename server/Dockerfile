FROM node:18-alpine

WORKDIR /app

# Install dependencies first (leverages Docker cache layer caching)
COPY package*.json ./
RUN npm install --production

# Copy remaining server codebase files
COPY . .

# Expose server listener port
EXPOSE 5000

CMD ["npm", "start"]

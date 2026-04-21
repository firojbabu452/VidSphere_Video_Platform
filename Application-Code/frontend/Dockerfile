FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build the app
RUN npm run build
# Install a tiny server to serve the build folder
RUN npm install -g serve
# Start the server on port 3000
CMD ["serve", "-s", "build", "-l", "3000"]

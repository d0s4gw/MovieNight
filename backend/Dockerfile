# Use a lightweight Node.js alpine image
FROM node:20-alpine

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install --omit=dev

# Copy local code to the container image.
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Run the web service on container startup.
CMD [ "npm", "start" ]

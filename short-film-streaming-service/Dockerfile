# Dockerfile is a blue print for an image
# A docker image is a blue print for a container

# Extend from parent image (present in dockerhub)
FROM node:18

WORKDIR /app

# Copy our app's files into the working directory
COPY package*.json ./

# Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Install needed packages specified in package.json
RUN npm install

# Copy app source inside the docker image
COPY .  .

# Make port 3000 available outside the container
EXPOSE 3000

# Command to run the app (only one CMD allowed) (runs to startup the container)
CMD [ "npm", "start" ]


# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:14-alpine

ARG ENV_NAME

# Create and change to the app directory.
WORKDIR /app

# Add ssh
RUN apk add --update --no-cache openssh-client git \
	&& mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
#RUN yarn install --production
#RUN npm install --only=production
#RUN yarn install && yarn cache clean
RUN npm install

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup.
#CMD [ "yarn", "prod" ]
#CMD [ "npm", "start" ]
RUN yarn build:${ENV_NAME}

# 使用nginx代理
FROM nginx:stable-alpine
COPY --from=0 /app/nginx.conf /etc/nginx/conf.d/
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

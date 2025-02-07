# short-film-streaming

## Modules/Library installation commands:
npm init -y
npm install express
npm install --save-dev typescript ts-node
npm i --save-dev @types/node @types/express
npm i fluent-ffmpeg
npm i --save-dev @types/ffmpeg
sudo apt-get update && sudo apt-get -y install ffmpeg

docker build -t short-film-streaming .
docker run -p 3000:3000 -d short-film-streaming
docker ps (like ls to display all containers)
docker cp wonderful_carver:/app/processed-big_buck_bunny_720p_5mb.mp4 ./

npm install @google-cloud/storage
https://cloud.google.com/sdk/docs/install#deb

gcloud auth login
gcloud config set project short-film-streaming

### build and push docker image to artifact registry
docker build -t asia-south2-docker.pkg.dev/short-film-streaming/short-film-streaming-repo/short-film-streaming-image .
gcloud auth configure-docker \
    asia-south2-docker.pkg.dev

docker push asia-south2-docker.pkg.dev/short-film-streaming/short-film-streaming-repo/short-film-streaming-image
gcloud services enable run.googleapis.com

### create buckets (pap : public access prevention)
gsutil mb -l asia-southeast2 --pap=enforced gs://sfs-raw-videos
#### when a file is uploaded in the bucket, a notification must be sent to the pubsub topic. The topic will pass the message to subscription and the subscription will make a POST request to the service
gsutil notification create -t video-uploads-topic -f json OBJECT_FINALIZE gs://sfs-raw-videos
gsutil mb -l asia-southeast2 gs://sfs-processed-videos


# Create next js app
npx create-next-app@latest .
npm install firebase

# Create Firestore Database
# Create Functions
npm install -g firebase-tools
npm install firebase-functions@latest firebase-admin@latest
npm run serve

npm i @google-cloud/storage

firebase deploy --only functions:generateUploadUrl

### Grant Storage Object Admin permission in cloud bucket
### Add role Service Account Token Creator

gcloud storage buckets update gs://sfs-raw-videos --cors-file=gcs-cors.json

### Enable IAM Service Account Credentials API

# Back to short-film-streaming-service
npm i firebase-admin
docker build -t asia-south2-docker.pkg.dev/short-film-streaming/short-film-streaming-repo/short-film-streaming-image .
docker push asia-south2-docker.pkg.dev/short-film-streaming/short-film-streaming-repo/short-film-streaming-image
Re deploy in Cloud Run

# Add getVideos cloud function

# Tech Stack
1. Frontend - React and Next JS
2. Backend - Express
3. File Storage - Google Cloud Storage
4. Build Manager - Google Artifact Registry
5. Build Running Server - Google Cloud Run
6. Auth - Firebase
7. Database - Firebase
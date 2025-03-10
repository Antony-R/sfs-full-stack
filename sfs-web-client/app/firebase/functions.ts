import {httpsCallable} from "firebase/functions";
import {functions} from "./firebase";
import {UserInfo} from "firebase/auth";
import {Timestamp} from "firebase/firestore";

const generateUploadUrl = httpsCallable(functions, 'generateUploadUrl');
const getVideosCloudFunction = httpsCallable(functions, 'getVideos');
const getMyUploadsCloudFunction = httpsCallable(functions, 'getMyUploads');
const submitVideoMetaFunction = httpsCallable(functions, 'submitVideoMeta');
const getVideoMetaFunction = httpsCallable(functions, 'getVideoMeta');
const getUserMetaFunction = httpsCallable(functions, 'getUserMeta');

export interface Video {
    id?: string,
    uid?: string,
    fileName?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string
    timestamp?: Timestamp
}

export async function uploadVideo(file: File): Promise<any> {
    const response: any = await generateUploadUrl({
        fileExtension: file.name.split('.').pop()
    });
    //Upload the file using signed URL
    const uploadResult = await fetch(response?.data?.url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        },
    });
    console.log(`Upload Result: ${uploadResult}`);
    
    const videoId = response?.data?.fileName.split('.')[0];
    return videoId;
}

export async function getVideos(lastVideoId: string | null) {
    const response = await getVideosCloudFunction({lastVisibleId: lastVideoId});
    return response.data;
}

export async function getMyUploads() {
    const response = await getMyUploadsCloudFunction();
    return response.data as Video[];
}

export async function submitVideoMeta(videoId: string, formData: FormData) {
    const video: Video = {
        title: formData.get('title')?.toString(),
        description: formData.get('description')?.toString()
    }
    const response = await submitVideoMetaFunction({videoId, video});
    console.log(`Video metadata update result: ${response.data}`);
}

export async function getVideoMeta(videoId: string) {
    const response = await getVideoMetaFunction({id: videoId});
    return response.data as Video;
}

export async function getUserMeta(userId: string) {
    const response = await getUserMetaFunction({id: userId});
    return response.data as UserInfo;
}
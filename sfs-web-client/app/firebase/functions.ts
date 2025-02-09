import {httpsCallable} from "firebase/functions";
import {functions} from "./firebase";

const generateUploadUrl = httpsCallable(functions, 'generateUploadUrl');
const getVideosCloudFunction = httpsCallable(functions, 'getVideos');
const getMyUploadsCloudFunction = httpsCallable(functions, 'getMyUploads');

export interface Video {
    id?: string,
    uid?: string,
    fileName?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string
}

export async function uploadVideo(file: File): Promise<Response>{
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
    return uploadResult;
}

export async function getVideos() {
    const response = await getVideosCloudFunction();
    return response.data as Video[];
}

export async function getMyUploads() {
    const response = await getMyUploadsCloudFunction();
    return response.data as Video[];
}
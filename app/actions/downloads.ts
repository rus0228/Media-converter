import { YoutubeVideo } from '../utils';

export const ADD_DOWNLOAD = 'ADD_DOWNLOAD';
export const SET_PROGRESS = 'SET_PROGRESS';
export const CANCEL_DOWNLOAD = 'CANCEL_DOWNLOAD';
export const OPEN_DOWNLOADED_FILE = 'OPEN_DOWNLOADED_FILE'

// @ts-ignore
export function addDownload(id:string, videoInfo:YoutubeVideo, video, fileType, downloadPath){
  return {
    type: ADD_DOWNLOAD,
    payload: {
      id,
      videoInfo,
      video,
      fileType,
      downloadPath
    }
  }
}

export function setProgress(id: string, progress: number, status: string) {
  return {
    type: SET_PROGRESS,
    payload: {
      id,
      progress,
      status
    }
  }
}

export function cancelDownload(id: string){
  return {
    type: CANCEL_DOWNLOAD,
    payload: {
      id
    }
  }
}

export function openDownloadedFile(id: string) {
  return {
    type: OPEN_DOWNLOADED_FILE,
    payload: {
      id,
    }
  }
}

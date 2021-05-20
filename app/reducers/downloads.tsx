import { Action } from 'redux';
import { ADD_DOWNLOAD, CANCEL_DOWNLOAD, OPEN_DOWNLOADED_FILE, SET_PROGRESS } from '../actions/downloads';
import produce from 'immer';
const { shell } = require('electron').remote

export default function reducer(state = [], action: Action<string>) {
  if (action.type === ADD_DOWNLOAD) {
    const { videoInfo, id, video, fileType, downloadPath } = action.payload;
    return produce(state, state => {
      state.unshift({
        id,
        videoInfo,
        status: 'Queued for download...',
        progress: 0,
        video,
        fileType,
        downloadPath,
      });
    });
  } else if (action.type === SET_PROGRESS) {
    const { id, progress, status } = action.payload;
    return produce(state, state => {
      const download = state.find(d => d.id === id);
      if (download) {
        download.status = status;
        download.progress = progress;
      }
    });
  } else if (action.type === CANCEL_DOWNLOAD) {
    const { id } = action.payload;
    return produce(state, state => {
      const download = state.find(d => d.id === id);
      if (!download) {
        return;
      }
      download.status = 'Cancelled';
      download.video.destroy();
    })
  } else if (action.type === OPEN_DOWNLOADED_FILE) {
    const { id } = action.payload;
    return produce(state, state => {
      const downloadedFile = state.find(d => d.id === id);
      console.log(downloadedFile.downloadPath)
      console.log(downloadedFile.fileType)
      console.log(downloadedFile.videoInfo.title)
      if (downloadedFile.fileType == '96k' || downloadedFile.fileType == '128k') {
        shell.showItemInFolder(`${downloadedFile.downloadPath}/${downloadedFile.videoInfo.title}(${downloadedFile.fileType}).mp3`)
      }
      else {
        shell.showItemInFolder(`${downloadedFile.downloadPath}/${downloadedFile.videoInfo.title}(${downloadedFile.fileType}).mp4`)
      }
    })
  }
  return state;
}

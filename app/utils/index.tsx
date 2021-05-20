import fs from 'fs';
import path from 'path';

const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const dialog = require('electron').remote.dialog;
const sanitize = require('sanitize-filename');

const endpoint = 'https://pandaconvert.com/api/v1/';
let ffmpegPath = '';
const param = process.argv.find(p => p.startsWith('--app-path='));
if (param) {
  ffmpegPath = param.split('=')[1];
  if (ffmpegPath.endsWith('.asar')) {
    ffmpegPath = path.join(path.dirname(ffmpegPath), 'ffmpeg');
  } else {
    ffmpegPath = path.join(ffmpegPath, 'ffmpeg');
  }
  if (os.platform() === 'win32') {
    ffmpegPath = ffmpegPath + '.exe';
  }
}

let rateLimitTriggered = false;

export interface YoutubeVideo {
  title: string;
  thumbnailUrl: string;
  url: string;
}

export async function fetchVideoInfo(url: string): Promise<YoutubeVideo> {
  const videoId = getVideoIdFromUrl(url);
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${url}&format=json`
  );
  if (response.status >= 200 && response.status < 300) {
    console.log(response);
    const { title, thumbnail_url, url } = await response.json();
    const totalInfo = await ytdl.getInfo(videoId);
    const formats = totalInfo.formats;
    console.log('video foramts are ==================', formats)
    let selectOptions = [];
    for (let i = 0; i <= formats.length-1; i++) {
      let item = formats[i].mimeType;
      if (item.includes('video/mp4;') && formats[i].audioBitrate == null) {
        selectOptions.push(formats[i].qualityLabel);
      }
    }
    return { title, thumbnailUrl: thumbnail_url, url, selectOptions };
  }
  throw new Error(
    `Error Occured - status code: ${status}, body:, ${response.body}`
  );
}

// @ts-ignore
export async function videoDownloadStart(id: string, url: string, title: string, toFolder: string, fileType: string, onProgress: (progress: number, status: string) => void) {
  const filename = sanitize(title);
  const videoId = getVideoIdFromUrl(url);
  if (fileType == '96k' || fileType == '128k') {
    const paths = await getVideoAsMp4(url, toFolder, `${filename}(${fileType})`, (p) => {
      onProgress(p, `Downloading video : ${Math.floor(p * 100)}%`);
    });
    await convertMp4ToMp3(paths, fileType, (p) => {
      if (p == 1) {
        onProgress(1, `Finished converting into audio.`);
      } else {
        onProgress(p, `Converting into audio: ${Math.floor(p * 100)}%`);
      }
    });

    fs.unlinkSync(paths.filePath);

    await (() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          onProgress(1);
          resolve();
        }, 900);
      });
    });

  } else {
    const audioOutput = path.resolve(toFolder, `${filename}(${fileType}[sound]).mp4`);
    const mainOutput = path.resolve(toFolder, `${filename}(${fileType}).mp4`);
    ytdl(url, {
      filter: format => format.container === 'mp4' && !format.qualityLabel,
    }).on('error', console.error)
      .on('progress', function(chunkLength: number, downloaded: number, all: number) {
      })
      // Write audio to file since ffmpeg supports only one input stream.
      .pipe(fs.createWriteStream(audioOutput))
      .on('finish', () => {
        const video = ytdl(url, {
          filter: format => format.qualityLabel === fileType && !format.audioEncoding,
        });
        video.on('progress', function (chunkLength: number, downloaded: number, all: number) {
          const p = downloaded / all;
          if (all > 0){
            onProgress( p, `Downloading video : ${Math.floor(p * 100)}%` )
          }
          if (p == 1) {
            onProgress(1, `Finished downloading video.`);
          }
        });
        ffmpeg()
          .setFfmpegPath(ffmpegPath)
          .input(video)
          .videoCodec('libx264')
          .input(audioOutput)
          .audioCodec('copy')
          .save(mainOutput)
          .on('error', console.error)
          .on('end', () => {
            fs.unlink(audioOutput, err => {
              if (err) console.error(err);
              else console.log(`\nfinished downloading, saved to ${mainOutput}`);
            });
          });
      });
  }
}

export async function destFolder() {
  return await dialog.showOpenDialog({ properties: ['openDirectory'] });
}

export async function setActivateApplication(licenseKey, uniqueId) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: `${licenseKey}`, device_id: `${uniqueId}` })
  };
  const response = await fetch(`${endpoint}licence-activation`, requestOptions);
  console.log(response);
  return response;
}

function getVideoAsMp4(urlLink, userProvidedPath, title, onProgress: (progress: number) => void) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(userProvidedPath, `tmp_${title}.mp4`);
    const video = ytdl(urlLink, { filter: 'audioonly' });
    video.on('progress', (chunkLength, downloaded, total) => {
      if (!rateLimitTriggered) {
        onProgress(downloaded / total);
        rateLimitTriggered = true;
        setTimeout(() => {
          rateLimitTriggered = false;
        }, 800);
      }
    });
    video.pipe(fs.createWriteStream(fullPath)).on('finish', () => {
      setTimeout(() => {
        resolve({ filePath: fullPath, folderPath: userProvidedPath, fileTitle: `${title}.mp3` });
      }, 1000);
    });
  });
}

function convertMp4ToMp3(paths, fileType, onProgress: (p: number) => void) {
  return new Promise((resolve, reject) => {
    rateLimitTriggered = false;
    console.log('ffmpeg Path is ', ffmpegPath);
    console.log('paths filePath is ', paths.filePath);
    ffmpeg(paths.filePath)
      .setFfmpegPath(ffmpegPath)
      .format('mp3')
      .audioBitrate(fileType)
      .on('progress', () => {
        if (!rateLimitTriggered) {
          onProgress(0.31);
          rateLimitTriggered = true;
          setTimeout(() => {
            rateLimitTriggered = false;
          }, 800);
        }
      })
      .output(fs.createWriteStream(path.join(paths.folderPath, sanitize(paths.fileTitle))))
      .on('end', () => {
        onProgress(1);
        resolve();
      })
      .run();
  });
}

function getVideoIdFromUrl(url) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length == 11) {
    return match[2];
  } else {
    return null;
  }
}

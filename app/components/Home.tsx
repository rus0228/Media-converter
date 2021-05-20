import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';
import styles from './Home.css';
import { useDelay } from '../hooks';
import { fetchVideoInfo } from '../utils';
import { videoDownloadStart } from '../utils';
import { destFolder } from '../utils';
import { isEmpty } from 'lodash';
import DownloadComponent from './DownloadComponent';
import { connect } from 'react-redux';
import { addDownload, setProgress } from '../actions/downloads';
import { v4 as uuidv4 } from 'uuid';

const { dialog } = require('electron').remote;

const _tag = 'Home::';
const downloadsFolder = require('downloads-folder');

function Home(props) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState();
  const [downloadPath, setDownloadPath] = useState(downloadsFolder());
  const [optionValue, setOptionValue] = useState();
  const [options, setOptions] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  // How to get the info about youtube video
  const scheduleCheckUrl = useDelay(async (url: string) => {
    try {
      const result = await fetchVideoInfo(url.trim());
      setShowLoader(false);
      const options = new Set(result.selectOptions);
      const finalOptions = [...options];
      setVideoInfo(result);
      setOptions(finalOptions);
      setOptionValue(finalOptions[0]);
      console.log(_tag, 'scheduleCheckUrl() - videoInfo', videoInfo);
    } catch (e) {
      setShowLoader(false);
      setVideoInfo(null);
      const options = {
        buttons: ['OK'],
        detail: 'We processed your links, but some videos cannot be downloaded for various reasons. These links were skipped. Skipped 1 of 1 links.',
        message: 'Some links are not available'
      };
      dialog.showMessageBox(null, options);
      console.log(e);
    }
  }, 1000);

  const updateVideoUrl = (newUrl: string) => {
    setShowLoader(true);
    setVideoUrl(newUrl);
    scheduleCheckUrl(newUrl);
  };

  const videoDownload = () => {
    if (!videoUrl || !videoInfo) {
      console.log('videoUrl or video Info is NULL');
      return;
    }
    const id = uuidv4();
    console.log(id);
    setOptionValue(optionValue);
    const video = videoDownloadStart(id, videoUrl, videoInfo.title, downloadPath, optionValue, (p, status) => {
      props.setProgress(id, p, status);
    });
    props.addDownload(id, videoInfo, video, optionValue, downloadPath);
  };

  const onSelectDownloadFolder = async () => {
    try {
      const result = await destFolder();
      console.log('OpenDialogResult => ', result);
      const len = result?.filePaths?.length || 0;
      if (len > 0) {
        setDownloadPath(result.filePaths[0]);
      }
    } catch (error) {

    }
  };

  const isDownloadEnabled = !isEmpty(videoInfo?.title);

  return (
    <div>
      <Link to={routes.COUNTER} className={styles.active}>Activate</Link>
      <div>
        <input type="text" value={videoUrl} onChange={evt => updateVideoUrl(evt.target.value)}
               className={styles.urlInput}/>
        {showLoader && (
          <span className={styles.loader}></span>
        )}
      </div>
      <div>
        {options.length > 1 && (
          <select value={optionValue} onChange={evt => setOptionValue(evt.target.value)}
                  className={styles.qualitySelect}>
            {options.map((index) => (
              <option value={index}>mp4 {index}</option>
            ))}
            <option value='128k'>mp3 (low)</option>
            <option value='96k'>mp3 (high)</option>
          </select>
        )}
        <button onClick={videoDownload} disabled={!isDownloadEnabled} className={styles.downloadBtn}>
          Download
        </button>
      </div>
      <div className={styles.downloadItems}>
        {props.downloads.map(d => {
          return (
            <DownloadComponent
              key={d.videoInfo.url}
              id={d.id}
              videoInfo={d.videoInfo}
              fileType={d.fileType}
              status={d.status}
              progress={d.progress}
            />
          );
        })}
      </div>
      <div className={styles.downPath}>
        <button onClick={onSelectDownloadFolder} className={styles.folderSelect}>
          Select Folder
        </button>
        {downloadPath != downloadsFolder() && (
          <span> {downloadPath}</span>
        )}
      </div>
    </div>
  );
}

export default connect(
  state => {
    return {
      downloads: state.downloads
    };
  },
  dispatch => ({
    addDownload: (id, videoInfo, stream, fileType, downloadPath) => {
      dispatch(addDownload(id, videoInfo, stream, fileType, downloadPath));
    },
    setProgress: (id, progress, status) => {
      dispatch(setProgress(id, progress, status));
    }
  })
)(Home);

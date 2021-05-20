import React from 'react';
import styles from '../Home.css';
import { YoutubeVideo } from '../../utils';
import { connect } from 'react-redux';
import { cancelDownload, openDownloadedFile } from '../../actions/downloads';
import FlexBox from '../FlexBox';

export interface Props {
  videoInfo: YoutubeVideo;
  status: string;
  progress: number;
  id: string;
  fileType: string;
  downloadPath: string;
}

const DownloadComponent: React.FC<Props> = (props: Props) => {
  const videoInfo = props.videoInfo;
  return (
    <FlexBox className={styles.eachDownload}>
      <FlexBox style={{flexDirection: 'column'}}>
        <FlexBox style={{flexDirection: 'row'}}>
          <FlexBox>
            <img src={videoInfo.thumbnailUrl} className={styles.videoImage}/>
          </FlexBox>
          <FlexBox className={styles.findFile}>
            <button onClick={() => props.openDownloadedFile(props.id)} className={styles.findBtn}>
                <span>&#128193;</span>
            </button>
          </FlexBox>
          <FlexBox style={{flexDirection: 'column'}} className={styles.downloadInfo}>
            {
              videoInfo.title.length > 30 && (
                <span className={styles.videoTitle}>
                  {videoInfo.title.substring(0, 20)} ... {videoInfo.title.substring(videoInfo.title.length-9, videoInfo.title.length)}({props.fileType}).mp4
                </span>
              )
            }
            {
              videoInfo.title.length < 30 && (
                <span className={styles.videoTitle}>
                  {videoInfo.title}({props.fileType}).mp4
                </span>
              )
            }
            <span className={styles.videoStatus}>{props.status}</span>
          </FlexBox>
          <FlexBox className={styles.cancelItem}>
            {
              props.progress < 1 && (
                <button onClick={() => props.cancelDownload(props.id)} className={styles.cancelDownload}>
                  <span className={styles.stopDownload}>&#9632;</span>
                </button>
              )
            }
          </FlexBox>
        </FlexBox>
      </FlexBox>
      {
        props.progress > 0 && props.progress < 1 && (
          <progress value={props.progress} className={styles.progressbar} max={1.0}>0</progress>
        )
      }
    </FlexBox>
  );
};

export default connect(
  state => {
    return {
      downloads: state.downloads
    };
  },
  dispatch => ({
    cancelDownload: (id: string) => {
      dispatch(cancelDownload(id));
    },
    openDownloadedFile: (id: string) => {
      dispatch(openDownloadedFile(id))
    }
  })
)(DownloadComponent);

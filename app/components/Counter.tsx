import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Counter.css';
import routes from '../constants/routes.json';
import {machineId, machineIdSync} from 'node-machine-id';
import {setActivateApplication} from '../utils';
import { useDelay } from '../hooks';

export default function Counter() {
  const [uniqueId, setUniqueId] = useState('');
  const [licenseKey, setLicenseKey] = useState('')
  const setUniqueIdFunc = async () => {
    const Id = await machineId();
    setUniqueId(Id)
    console.log(Id);
  }
  const checkLicenseKey = useDelay(async (newKey: string) => {
      console.log('newKey ===', newKey)
  }, 1000)

  const updateSetLicenseKeyFunc = (newKey: string) => {
    setLicenseKey(newKey)
    checkLicenseKey(newKey)
  }
  const activateApplication = async () => {
    const result = await setActivateApplication(licenseKey, uniqueId)
    console.log(result)
  }
  return (
    <div>
      <div className={styles.backButton} data-tid="backButton">
        <Link to={routes.HOME} className={styles.link}>
          Back
        </Link>
      </div>

      <div>
          <button onClick={setUniqueIdFunc}>Get Machine ID</button>
          {uniqueId && (
            <div>{uniqueId}</div>
          )}
      </div>
      <div>
        <div style={{paddingTop: 20}}>Please enter your actication code.</div>
        <input type='text' value={licenseKey} onChange={evt => updateSetLicenseKeyFunc(evt.target.value)}/>
        {licenseKey && (
          <div>{licenseKey}</div>
        )}
      </div>
      <div>
        <button onClick={activateApplication}>activate</button>
      </div>
    </div>
  );
}

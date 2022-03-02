import { DS } from "brainsatplay-data";
import { PPGStruct, IMUStruct, ECGStruct, EMGStruct } from "brainsatplay-data/dist/src/types";
import { Math2 } from "../Math2";


//PPG Data
let nSec = 200;
let fs = 50;

let sine1 = Math2.genSineWave(0.9,500,nSec,fs,60,50); //'red' ppg raw plus 60hz noise
let sine2 = Math2.genSineWave(0.9,700,nSec,fs,60,50); //'ir' ppg raw plus 60hz noise (to show filtering)
let times = Math2.linspace(Date.now()-nSec*1000,Date.now(),200);

sine1 = Math2.vecadd(sine1,new Array(sine1.length).fill(5000))
sine2 = Math2.vecadd(sine1,new Array(sine2.length).fill(5500))


let breathrate = 6; //breaths per minute
let breathlossrate = 2; //lose 2 breaths per minute




export const dummyppg:PPGStruct = DS.PPGStruct(
    'dummyppg',
    {
        red:sine1,
        ir:sine2,
        times,
        count:nSec*fs,
        startTime:times[0]

    }
)

//breaths timestamps and rates to simulate alerts
export const breatharr:number[] = [];
export const breathratearr:number[] = [];

for(let i = nSec/60; i > 0; i--) {
    let j = 0;
    while (j < breathrate) {
        breatharr.push(Date.now()-i*nSec+j/1000);
        breathratearr.push(breathrate);
        dummyppg.beat_detect.breaths.push({
            t:breatharr[breatharr.length-1], rate:breathrate
        })
        j++;
    }
    breathrate-= breathlossrate;
}


export const dummyimu:IMUStruct = DS.IMUStruct(
    'dummyimu',
    {

    }
);

export const dummyecg:ECGStruct = DS.ECGStruct(
    'dummyecg',
    {

    }
);

export const dummyemg:EMGStruct = DS.EMGStruct(
    'dummyemg',
    {

    }
);


export const dummyfitbit:any = {
    
}

//use the converter in brainsatplay-data to turn the fitbit data into the desired event structs
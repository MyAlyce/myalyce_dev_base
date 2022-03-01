
import { DS } from "brainsatplay-data"
import { PPGStruct } from "brainsatplay-data/dist/src/types"

/*
type PPGStruct = {
    tag:string|number|undefined
    position: {
        x: number;
        y: number;
        z: number;
    };
    count: number;
    times: number[];
    red: number[];
    ir: number[];
    ir2: number[];
    ambient: number[];
    ratio: number[];
    temp: number[];
    beat_detect: {
        beats: any[];
        breaths: any[];
        rir: any[];
        ... 9 more ...;
        peak_dists2: any[];
    };
    startTime: string | number;
}
*/


let dummydata:PPGStruct = DS.PPGStruct(
    'dummy',
    {
        red:Math2.genSineWave()
    }
)
import React, {Component} from 'react'

//streaming cams, charts, vitals, etc.

type P = {

}

export class DataStream extends Component<P>  {

    render() {
        return (
        <div>
            <div>
                Data stream header
            </div>
            <div>
                Charts/logs
            </div>
        </div>
        );
    }
}
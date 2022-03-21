import { toISOLocal } from 'brainsatplay-storage'
import React, {Component} from 'react'
type VTimelineProps = {
    structs:any[]
}

//vertical timeline displays structs in order of timestamp.
// this is scrollable and clicking expands the data tile
export class VTimeline extends Component<VTimelineProps> {

    render() {
        return (
            <ul 
                style={{ //list style
                    paddingLeft: '33px', 
                    marginBottom: '2.5em', 
                    borderLeft: '1px solid gray'
                }}
            >
                {this.props.structs.map((s) => {
                    return <li>{s.structType} - {toISOLocal(s.timestamp)}</li>
                })}
            </ul>
        )
    }

}
import React, {Component} from 'react'
import { VTimeline } from './verticaltimeline.component'


//card to provide an abbreviated view of the data structs provided to the card
type SummaryCardProps = {
    structs:any[],
    visuals:string[] //provide string of visuals to be enabled in the summary e.g. ppg charts that can pull more data in
}

export class SummaryCard extends Component<SummaryCardProps> {

    prepareVisuals() {
        //some structs can visualize on their own
        // some structs are visualized on time series with previous data
    }

    render() {
        return(
            <div>
                <table>
                <tr>
                    <td>Graphs</td>
                    <td>
                        <VTimeline 
                            structs={this.props.structs}
                        />
                    </td>
                </tr>
                </table>
            </div>
        )
    }

}
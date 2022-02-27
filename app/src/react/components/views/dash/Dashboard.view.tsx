import React, { Component } from 'react';
//see the Figma: https://www.figma.com/file/PFs4wWMt7IZdMm7Dlt9MDz/MyAlyce-Web-Front-End?node-id=0%3A1
interface P {}

export class DashContainer extends Component<P>  {

    render() {
        return (
        <div>
            <div style={{height:200, border:'1px solid black', borderRadius:5 }}>
                User Card + Summary
            </div>
            <div style={{height:300, border:'1px solid black', borderRadius:5 }}>
                Timeline
            </div>
            <div style={{height:300, border:'1px solid black', borderRadius:5 }}>
                Scrollview of selected details/summaries
            </div>
        </div>
        );
    }
}
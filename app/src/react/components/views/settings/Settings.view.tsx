import React, { Component } from 'react';

interface P {}

export class SettingsView extends Component<P>  {

    render() {
        return (
        <div>
            <div>
                Profile Deets + Editing
            </div>
            <div>
                More fine grained permissions and opt-in stuff
            </div>
        </div>
        );
    }
}
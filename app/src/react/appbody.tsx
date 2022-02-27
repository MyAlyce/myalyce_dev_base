//Main body, so this has the startup logic and route setup for the react component hiearchy
import React from 'react'

import logo from 'src/public/assets/myalyce.png'

import { NavDrawer, TopBar } from 'my-alyce-component-lib';
import { sComponent } from './components/templates/state.component';
import { Login } from './components/dev/Login.Test';
import { DashContainer } from './components/views/dash/Dashboard.view';
import { PeerGroupsContainer } from './components/views/peers/PeerGroups.view';
import { SettingsView } from './components/views/settings/Settings.view';


const brand = () => {return <img src={logo} alt='MyAlyce'/>};

const TESTVIEWS = false; //skip login page (debug)

export class App extends sComponent {

    state = {
        isLoggedIn: false,
        navOpen: false,
        route: '/'
    }

    setNavOpen(b:boolean) {
        this.setState({navOpen:b});
    }

    render() {
        //return (p.appIsInitialized ? 
        
        //console.log(this.state.route, this.state.navOpen, state.data)
        return (
            <div>
                <NavDrawer fixed="left" zIndex={102} isOpen={this.state.navOpen} 
                    brand={brand()} 
                    onBackdropClick={() => this.setState({navOpen:false})} menuItems={[
                        { type: 'action', icon: 'D' as any, onClick: () => this.setState({'route':'/dashboard', navOpen:false}), title: 'Dashboard' },
                        { type: 'action', icon: 'P' as any, onClick: () => this.setState({'route':'/peers',     navOpen:false}), title: 'Peers & Groups' },
                        { type: 'action', icon: 'S' as any, onClick: () => this.setState({'route':'/settings',  navOpen:false}), title: 'Profile Settings' }
                    ]}
                /> 
                <div id="view">
                    <TopBar zIndex={100} fixed onMenuExpand={() => {
                        let open = !this.state.navOpen;
                        this.setState({'navOpen':open})
                        }} /> 
                    <div id='viewcontent'>
                        {(!this.state.isLoggedIn && !TESTVIEWS) && 
                            <Login></Login>
                        }
                        { (this.state.isLoggedIn || TESTVIEWS) &&
                            <div id='route'>
                                { (this.state.route.includes('dashboard') || this.state.route === '/' || this.state.route === '') &&
                                    <DashContainer/>
                                }
                                { this.state.route.includes('peers') &&
                                    <PeerGroupsContainer/>
                                }
                                { this.state.route.includes('settings') &&
                                    <SettingsView/>
                                }
                            </div>
                        }
                    </div>
                </div> 
            </div>
        )
    }
};  

//Main body, so this has the startup logic and route setup for the react component hiearchy
import React from 'react'

//import * as logo from 'src/public/assets/myalyce.png'

import { NavDrawer, TopBar } from 'my-alyce-component-lib';
import { sComponent } from './components/templates/state.component';
//import { Login } from './components/dev/Login.Test';
import { DashContainer } from './components/views/dash/Dashboard.view';
import { PeerGroupsContainer } from './components/views/peers/PeerGroups.view';
import { SettingsView } from './components/views/settings/Settings.view';

import {Login} from 'my-alyce-component-lib'
import { login, onLogin } from 'src/tools/scripts/login';
import { restoreSession } from 'src/tools/scripts/state';

import { Dev } from './components/dev/Dev.view';

const brand = () => {
  return <img src="src/assets/myalyce.png" width='100px' alt='MyAlyce'/>
};

const TESTVIEWS = true; //skip login page (debug)
//create a dummy user with some data to populate the frontend as naturally as possible, also

export class App extends sComponent {

    state = {
        isLoggedIn: false,
        navOpen: false,
        route: '/'
    }

    onLoginClick(c:{email:string,password:string}) {
        login(c.email,c.password).then(async (result) => {
            let u = await onLogin(result); //process login
            if(u) await restoreSession(u); //restore previous session if matching user
        })
    }

    onGoogleLoginClick() {
        login('google').then(async (result) => {
            let u = await onLogin(result); //process login
            if(u) await restoreSession(u); //restore previous session if matching user
        })
    }

    setNavOpen(b:boolean) {
        this.setState({navOpen:b});
    }

    render() {

        //console.log(this.state.route, this.state.navOpen, state.data)
        console.log(this.state.route)
        return (
            <div>
                {(!this.state.isLoggedIn && !TESTVIEWS) && 
                    <Login
                        useRegularLogin={true}
                        onLoginClick={this.onLoginClick}
                        thirdPartyLogins={[
                            {
                                name:'google',
                                logo:(<img src="src/assets/google.png" width="50px"></img>),
                                onClick:this.onGoogleLoginClick
                            }
                        ]}   
                    ></Login>
                }
                { (this.state.isLoggedIn || TESTVIEWS) &&
                <div>
                  <NavDrawer fixed="left" zIndex={102} isOpen={this.state.navOpen} 
                      brand={brand()} 
                      onBackdropClick={() => this.setState({navOpen:false})} menuItems={[
                          { type: 'action', icon: 'D' as any, onClick: () => this.setState({'route':'/dashboard', navOpen:false}), title: 'Dashboard' },
                          { type: 'action', icon: 'P' as any, onClick: () => this.setState({'route':'/peers',     navOpen:false}), title: 'Peers & Groups' },
                          { type: 'action', icon: 'S' as any, onClick: () => this.setState({'route':'/settings',  navOpen:false}), title: 'Profile Settings' },
                          { type: 'action', icon: 'D' as any, onClick: () => this.setState({'route':'/dev',  navOpen:false}),      title: 'DEV MODE' }
                      ]}
                  /> 
                  <div id="view">
                      <TopBar zIndex={0} onMenuExpand={() => {
                          let open = !this.state.navOpen;
                          this.setState({'navOpen':open})
                          }} /> 
                      <div id='viewcontent'>
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
                                  { this.state.route.includes('dev') &&
                                      <Dev/>
                                  }
                              </div>
                        
                      </div>
                  </div> 
                </div>
                }
            </div>
        )
    }
};  

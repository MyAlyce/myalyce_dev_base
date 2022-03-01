import React from 'react'
import { sComponent } from '../templates/state.component';
import { randomId } from 'src/tools/scripts/utils';
import { login, onLogin } from 'src/tools/scripts/login';
import { state } from 'src/tools/scripts/state';

export class Login extends sComponent {

    id=randomId('login')

    state = {
        isLoggedIn: false
    }

    constructor(props:any) {
        super(props);
    }

    login = () => {
        let email = (document.querySelector(this.id+'email') as any).value;
        let pass =  (document.querySelector(this.id+'pass') as any).value;

        //initial login check, grabs the realm login information if it exists
        login(email,pass).then(async (result) => {
            if(result.type === 'FAIL') {
                //show login page 
                state.setState({
                    isLoggedIn: false
                });
                //then wait for login
            } else {
                await onLogin(result);
                //console.log(client);
                //state.data.isLoggedIn is true, trigger the app to re-render (need to add logic)
            }
        });
    }

    googlelogin = () => {
        login('google').then(async (result) => {
            if(result.type === 'FAIL') {
                //show login page 
                state.setState({
                    isLoggedIn: false
                });
                //then wait for login
            } else {
                await onLogin(result);
                //console.log(client);
                //state.data.isLoggedIn is true, trigger the app to re-render (need to add logic)
            }
        });
    }

    render() {
        return (
            <div>
                Email:  <input id={this.id+"email"} type='email' placeholder='example@example.com'></input><br/>
                Pass:   <input id={this.id+"pass"} type='password'></input><br/>
                Submit: <button onClick={this.login} id={this.id+"submit"}>Submit</button>
                Google: <button onClick={this.googlelogin} id={this.id+"google"}>Google</button>
            </div>
        );
    }

}
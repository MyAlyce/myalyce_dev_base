import React from 'react';
import { sComponent } from '../templates/state.component';
import { runTests } from 'src/scripts/dev/test.comms';

export class Dev extends sComponent  {

    async componentDidMount() {
        let res = await runTests();
        console.log(res);
    }

    render() {
        return (
        <div>
            <div>
                DEV TEST (see console -- Press F12)
            </div>
        </div>
        );
    }
}
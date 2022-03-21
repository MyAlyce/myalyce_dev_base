import React, {Component} from 'react'
//import { sComponent } from '../templates/state.component';
import { randomId } from 'src/tools/scripts/utils';
// import { client } from 'src/tools/scripts/client';
// import { state } from 'src/tools/scripts/state'
import { Button, Form } from 'react-bootstrap';
//import { KeyboardJS } from 'keyboardjs';

//editable profile card
export class EditableText extends Component<
    {
    text:string|undefined, 
    editable?:boolean, 
    type?:string,
    onSubmit?:Function | undefined,
    onCancel?:Function | undefined
}
> {

    id=randomId('editabletext')

    state = {
        editing:false,
        value:"",
        lastValue:""
    }

    nClicks=0

    constructor( props = {
        text:"Placeholder",
        type:"text",
        editable:true,
        onSubmit:undefined,
        onCancel:undefined
    }) {
        super(props);
        this.state.value = props.text;

        if(props.onSubmit) this.onSubmit = props.onSubmit;
        if(props.onCancel) this.onCancel = props.onCancel;
    }

    onClick() {
        this.nClicks++;
        setTimeout(()=>{this.nClicks = 0;},300);
        if(this.nClicks > 1) {
            this.setState({lastValue:this.state.value, editing:true});
        }
    }

    onSubmit() {
        
    }

    onCancel() {
        
    }

    submithandler() {
        this.onSubmit();
        this.setState({editing:false});
    }

    cancelhandler() {
        this.onCancel();
        this.setState({value:this.state.lastValue, editing:false});
    }

    render() {
        return (
            <Form>
                <Form.Control
                    id={this.id+'input'} 
                    type={this.props.type} 
                    value={this.state.value} 
                    placeholder={this.props.text} 
                    disabled={!this.state.editing} 
                    readOnly={!this.state.editing} 
                />
                {this.state.editing && <span>
                    <Button id={this.id+'submit'} onClick={this.submithandler}>✔️</Button>
                    <Button id={this.id+'cancel'} onClick={this.cancelhandler}>❌</Button>
                    </span>
                } 
            </Form>
        );
    }

}
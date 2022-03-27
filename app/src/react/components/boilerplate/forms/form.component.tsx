import React, {Component} from 'react'
import { randomId } from 'src/tools/scripts/utils';

export type FormInputSettings = {
    type:'text' | 'number' | 'email' | 'password' | 
        'date' | 'file' | 'datetime-local' | 'checkbox' | 
        'color' | 'button' | 'radio' | 'range' | 'search' | 
        'submit' | 'url' | 'month' | 'week' | 'hidden' |
        'image' | 'reset' | 'time' | 'tel',
    name:string,
    label?:string,
    required?:boolean,
    placeholder?:any,
    value?:any,
    inputClass?:string,
    labelClass?:string
};

export type FormProps = {
    inputs:FormInputSettings[],
    onSubmit?:(id:string)=>void,
    submitClass?:string,
    onCancel?:(id:string)=>void,
    cancelClass?:string
};

export function checkValidity(
    formId:string, 
    isValid:(elem:HTMLInputElement)=>void = (elem) => {elem.style.backgroundColor='white'; return;}, 
    isInvalid:(elem:HTMLInputElement)=>void = (elem) => {elem.style.backgroundColor='tomato'; return;}
) {
    if(!formId) return;

    for (const el of (document.getElementById(formId) as HTMLFormElement).querySelectorAll("[required]")) {
        if (!(el as HTMLInputElement).reportValidity()) {
            //highlight the element
            isInvalid(el as HTMLInputElement);
            return;
        } else {
            isValid(el as HTMLInputElement);
        }
    }

    return;
}

//let setting = new FormInputSetting(


export class FormInputSetting {
    type; name; required; placeholder; value; label; inputClass; labelClass; 

    constructor(
        type:'text' | 'number' | 'email' | 'password' | 
        'date' | 'file' | 'datetime-local' | 'checkbox' | 
        'color' | 'button' | 'radio' | 'range' | 'search' | 
        'submit' | 'url' | 'month' | 'week' | 'hidden' |
        'image' | 'reset' | 'time' | 'tel',
        name:string,
        label?:string,
        required?:boolean,
        placeholder?:any,
        value?:any,
        inputClass?:string,
        labelClass?:string
    ) {
        this.type = type;
        this.name = name;
        this.label = label;
        this.required = required;
        this.placeholder = placeholder;
        this.value = value;
        this.inputClass = inputClass;
        this.labelClass = labelClass;
    };
}

export class FormTemplate extends Component<FormProps> {

    id=randomId('form');

    render() {
        return (
            <form id={this.id}>
                {this.props.inputs.map((setting) => {
                    return (
                        <>
                            {setting.label && <label htmlFor={setting.name} className={setting.labelClass}>{setting.label} </label>}
                            <input type={setting.type} name={setting.name} id={this.id+setting.name} className={setting.inputClass} required={setting.required}></input>
                        </>
                    )
                })}
                {this.props.onSubmit && 
                    <button id={this.id+'submit'} className={this.props.submitClass} onClick={()=>{(this.props.onSubmit as any)(this.id)}}>✔️</button>
                }
                {this.props.onCancel &&
                    <button id={this.id+'cancel'} className={this.props.cancelClass} onClick={()=>{(this.props.onCancel as any)(this.id)}}>❌</button>
                }
            </form>
        )
    }
}
 
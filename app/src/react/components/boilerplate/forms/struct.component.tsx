import React, {Component} from 'react'
import { randomId } from 'src/tools/scripts/utils';
import { FormInputSettings, FormTemplate, FormInputSetting, checkValidity } from './form.component';
import { DS } from 'brainsatplay-data';
import {client} from 'src/tools/scripts/client'

type StructFormProps = {
    structType:string|undefined,
    ownerId:string,
    inputs:FormInputSettings[]
};

function findStructBuilder(structType:string) {
    if(!structType) return undefined;
    return  Object.keys(DS.structRegistry).find((r:string) => {
        if(r.toLowerCase().includes(structType)) return true;
        else return false;
    });
} 
//generate a struct form based on an existing type
export function genStructForm(structType:'struct', ownerId:string, inputClass?:string, labelClass?:string) {

    let structkey = findStructBuilder(structType);

    let inputs:FormInputSettings[] = [

    ];

    if(!structkey) return;
    else {
        let struct = (DS.structRegistry as any)[structkey]() as any;

        Object.keys(struct).forEach((key) => {
            if(typeof struct[key] === 'string' || typeof struct[key] === 'number' && !(key === '_id' || key === 'structType' || key === 'ownerId')) {
                let inptype = 'text';
                if(key === 'timestamp') inptype = 'datetime-local';
                else if(typeof struct[key] === 'number') inptype = 'number'
                inputs.push(
                    new FormInputSetting(
                        inptype as any,
                        key,
                        key,
                        undefined,
                        struct[key],
                        struct[key],
                        inputClass,
                        labelClass
                    )
                );
            }
        })
    }

    return <StructForm
        structType={structType}
        ownerId={ownerId}
        inputs={inputs}
    ></StructForm>
}

export class StructForm extends Component<StructFormProps> {

    id=randomId('structform');

    inputs:FormInputSettings[]=[];

    constructor(props:StructFormProps) {
        super(props);
        if(!props.structType) this.inputs.push(
            new FormInputSetting(
                'text',
                'structType',
                'Struct Type',
                true,
                'struct',
                'struct'
            )
        ); //for untypes structs make it so we can add/remove arbitrary form inputs
        this.inputs.push(...props.inputs);
    }


    onSubmit=async (id:string) => {

        let valid = checkValidity(
            id,
            undefined,
            (el)=>{(el as HTMLElement).style.backgroundColor = `rgb(200,100,100)`;}
        ); //e.g.})

        if(!valid) return;

        let struct:any;
        let structbuilder = findStructBuilder(this.props.structType as string);
        
        if(!this.props.structType || !structbuilder) struct = DS.Struct(undefined,undefined,{_id:this.props.ownerId});
        else struct = (DS.structRegistry as any)[structbuilder as string](undefined,undefined,{_id:this.props.ownerId});

        this.inputs.forEach((setting) => {
            struct[setting.name] = (document.getElementById(id+setting.name) as HTMLInputElement).value;
            if(setting.type === 'number' && typeof struct[setting.name] == 'string') struct[setting.name] = parseFloat(struct[setting.name]);
        });

        await client.setData(struct as any);
    }   

    onCancel=(id:string) => {
        for (const el of (document.getElementById(id) as HTMLFormElement).querySelectorAll("input")) {
            el.value = ""; //reset values
        }
    }

    render() {
        return (
            <FormTemplate
                inputs={this.inputs}
                onSubmit={this.onSubmit}
                onCancel={this.onCancel}
            ></FormTemplate>
        );
    }
}


//make a form template
// make form input settings for each struct input
//  append arbitrary inputs to set arbitrary props on the struct
//   submit returns and/or writes the struct to the server
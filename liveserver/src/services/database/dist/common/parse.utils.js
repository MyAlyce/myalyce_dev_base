// Objects (with Functions)
export const safeParse = (input) => {
    if (typeof input === 'string')
        input = JSON.parse(input);
    if (typeof input === 'object') {
        // Convert Stringified Functions to String
        for (let key in input) {
            let value = input[key];
            let regex = new RegExp('(|[a-zA-Z]\w*|\([a-zA-Z]\w*(,\s*[a-zA-Z]\w*)*\))\s*=>');
            let func = (typeof value === 'string') ? value.substring(0, 8) == 'function' : false;
            let arrow = (typeof value === 'string') ? regex.test(value) : false;
            try {
                input[key] = (func || arrow) ? eval('(' + value + ')') : value;
            }
            catch (e) {
                console.error(e, value);
                input[key] = value;
            }
            if (typeof input[key] === 'object')
                safeParse(input[key]);
        }
        return input;
    }
    else
        return {};
};
export const safeStringify = (input, stringify = true) => {
    if (input instanceof Object)
        input = (Array.isArray(input)) ? [...input] : Object.assign({}, input);
    // Stringify Functions
    for (let key in input) {
        if (input[key] instanceof Function)
            input[key] = input[key].toString();
        if (input[key] instanceof Object) {
            // console.log(key, input[key])
            input[key] = safeStringify(input[key], false);
        }
    }
    // Actually Stringify
    return (stringify) ? JSON.stringify(input) : input;
};
// Functions
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
export function getParamNames(func) {
    if (func instanceof Function) {
        var fnStr = func.toString().replace(STRIP_COMMENTS, '');
        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if (result === null)
            result = [];
        return result;
    }
    else
        return;
}
export function parseFunctionFromText(method = '') {
    //Get the text inside of a function (regular or arrow);
    let getFunctionBody = (methodString) => {
        return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, '$2$3$4');
    };
    let getFunctionHead = (methodString) => {
        let startindex = methodString.indexOf(')');
        return methodString.slice(0, methodString.indexOf('{', startindex) + 1);
    };
    let newFuncHead = getFunctionHead(method);
    let newFuncBody = getFunctionBody(method);
    let newFunc;
    if (newFuncHead.includes('function ')) {
        let varName = newFuncHead.split('(')[1].split(')')[0];
        newFunc = new Function(varName, newFuncBody);
    }
    else {
        if (newFuncHead.substring(0, 6) === newFuncBody.substring(0, 6)) {
            //newFuncBody = newFuncBody.substring(newFuncHead.length);
            let varName = newFuncHead.split('(')[1].split(')')[0];
            //console.log(varName, newFuncHead ,newFuncBody);
            newFunc = new Function(varName, newFuncBody.substring(newFuncBody.indexOf('{') + 1, newFuncBody.length - 1));
        }
        else
            newFunc = eval(newFuncHead + newFuncBody + "}");
    }
    return newFunc;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UudXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb21tb24vcGFyc2UudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxDQUFDLEtBRXpCLEVBQUUsRUFBRTtJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRXpELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFDO1FBQzFCLDBDQUEwQztRQUMxQyxLQUFLLElBQUksR0FBRyxJQUFJLEtBQUssRUFBQztZQUNsQixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDdEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsdURBQXVELENBQUMsQ0FBQTtZQUMvRSxJQUFJLElBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQTtZQUNwRixJQUFJLEtBQUssR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7WUFFbkUsSUFBSTtnQkFDQSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7YUFDbEU7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDUixPQUFPLENB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
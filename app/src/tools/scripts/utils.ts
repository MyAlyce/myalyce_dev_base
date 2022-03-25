export function randomId(tag = '') {
    return `${tag+Math.floor(Math.random()+Math.random()*Math.random()*10000000000000000)}`;
}

export function getDictFromUrlParams(url = window.location) {
    const paramDict: any = {};
    const searchParams = new URLSearchParams(url.search);
    searchParams.forEach((val, key) => paramDict[key] = val);

    return paramDict;
}


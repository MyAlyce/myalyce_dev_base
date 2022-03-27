export function randomId(tag = '') {
    return `${tag+Math.floor(Math.random()+Math.random()*Math.random()*10000000000000000)}`;
}

export function getDictFromUrlParams(url = window.location) {
    const paramDict: any = {};
    const searchParams = new URLSearchParams(url.search);
    searchParams.forEach((val, key) => paramDict[key] = val);

    return paramDict;
}

export function parseISOString(s:any) {
    var b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}
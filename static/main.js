var url = "static/morpheus_form_lemma.txt";
var data = {};
function clean(x) {
    return x.normalize("NFD").replace('\u0304', '').replace('\u0306', '').normalize("NFC");
}
fetch(url).then(function (resp) {
    resp.text().then(function (text) {
        text.split("\n").forEach(function (e) {
            if (e.trim() !== "") {
                let parts = clean(e).trim().split("\t");
                let lemma = parts[1];
                let frm = parts[0];
                if (!frm.endsWith('’')) {
                    let parse = parts[2];
                    if (lemma in data) {
                        if (frm in data[lemma]) {
                            if (!(data[lemma][frm].includes(parse))) {
                                data[lemma][frm].push(parse);
                            }
                        }
                        else {
                            let d = {};
                            d[frm] = [parse];
                            data[lemma][frm] = [parse];
                        }
                    }
                    else {
                        let d = {};
                        d[frm] = [parse];
                        data[lemma] = d;
                    }
                }
            }
        });
        autocomplete(search_box, Object.keys(data));
    });
});
const data_display = document.getElementById('data-display');
const search_box = document.getElementById("search-box");
function genderNum(x) {
    if (x == "m") {
        return 0;
    }
    else if (x == "f") {
        return 1;
    }
    return 2;
}
function caseNum(x) {
    if (x == 'n') {
        return 0;
    }
    else if (x == 'v') {
        return 0;
    }
    else if (x == 'g') {
        return 1;
    }
    else if (x == 'd') {
        return 2;
    }
    else if (x == 'a') {
        return 3;
    }
}
function fillCell(xs) {
    let td = document.createElement('td');
    xs.forEach((x) => {
        let s = document.createElement('span');
        s.classList.add('form');
        s.textContent = x;
        td.appendChild(s);
    });
    return td;
}
function nouny(xs) {
    let names = ['nom', 'gen', 'dat', 'acc'];
    let out = [[[[], [], []], [[], [], []], [[], [], []], [[], [], []]], [[[], [], []], [[], [], []], [[], [], []], [[], [], []]], [[[], [], []], [[], [], []], [[], [], []], [[], [], []]]];
    xs.forEach(function (w) {
        let form = w[1][0];
        w[1][1].forEach((z) => {
            let parse = z;
            let number = 0;
            switch (parse[2]) {
                case "p":
                    number = 1;
                    break;
                case "d":
                    number = 2;
                    break;
                default:
                    number = 0;
            }
            let gender = genderNum(parse[6]);
            let c = caseNum(parse[7]);
            if (parse[0] == 't') {
                out[number][c][gender].push(form + ' (' + parse[3] + parse[5] + ')');
            }
            else if (parse[0] == 'a' && parse[8] !== '-') {
                out[number][c][gender].push(form + ' (' + parse[8] + ')');
            }
            else {
                out[number][c][gender].push(form);
            }
        });
    });
    let SGPL = 0;
    let sgplnam = ['SG', 'Pl', "DUAL"];
    out.forEach((x) => {
        let heading = document.createElement('h1');
        heading.textContent = sgplnam[SGPL];
        SGPL += 1;
        let tab = document.createElement("table");
        let i = 0;
        x.forEach((y) => {
            let m = y[0];
            let f = y[1];
            let n = y[2];
            let r = document.createElement('tr');
            let label = document.createElement('td');
            label.classList.add('caselabel');
            label.textContent = names[i];
            i = i + 1;
            if (i > 3) {
                i = 0;
            }
            r.appendChild(label);
            r.appendChild(fillCell(m));
            r.appendChild(fillCell(f));
            r.appendChild(fillCell(n));
            tab.appendChild(r);
        });
        data_display.appendChild(heading);
        data_display.appendChild(tab);
    });
}
function sortByTarget(xs, names, featureGetter, dropEmpty, debug, step) {
    let output = new Map();
    let counter = 0;
    names.forEach((x) => {
        output.set(x, []);
    });
    for (let pair of xs) {
        let i = 0;
        let form = pair[0];
        let parse = pair[1];
        let target = featureGetter(parse);
        if (debug) {
            console.log(pair);
            console.log(form);
            console.log("parse " + parse);
            console.log(target);
        }
        if (output.has(target)) {
            output.get(target).push([form, parse]);
        }
    }
    let o = [];
    for (let v of output.values()) {
        o.push(v);
    }
    if (debug) {
        console.log("result: " + step);
        console.log(o);
    }
    return o;
}
function sortByTense(xs) {
    return sortByTarget(xs, ['p', 'i', 'a', 'f', 'r', 'l'], (x) => x[3], false, false, "tense");
}
function sortByPersonNumber(xs) {
    return sortByTarget(xs, ['1s', '2s', '3s', '2d', '3d', '1p', '2p', '3p'], (x) => x.slice(1, 3), false, false, "pn");
}
function sortByVoice(xs) {
    return sortByTarget(xs, ['a', 'e', 'm', 'p'], (x) => x[5], true, false, "voice");
}
function sortByMood(xs) {
    let indicative = [];
    let subjunctive = [];
    let imperative = [];
    let infinitive = [];
    let optative = [];
    for (let [form, z] of xs) {
        let mood = z[4];
        switch (mood) {
            case "i":
                indicative.push([form, z]);
                break;
            case "s":
                subjunctive.push([form, z]);
                break;
            case "m":
                imperative.push([form, z]);
                break;
            case "o":
                optative.push([form, z]);
                break;
            case "n":
                //	infinitive.push([form, z]);
                break;
            default:
                break;
        }
    }
    return [indicative, subjunctive, optative, imperative]; //, //infinitive];
}
function flattenVerbs(xs) {
    let output = [];
    for (let [form, parses] of xs) {
        for (let parse of parses) {
            output.push([form, parse]);
        }
    }
    return output;
}
function display_infinitives(xs) {
    console.log("Infinitives");
    console.log(xs);
    let voices = sortByVoice(flattenVerbs(xs));
    let header = document.createElement('h1');
    header.textContent = "Infinitive";
    let counter = 0;
    let voiceNames = ['Active', 'Medio-passive', 'Middle', 'Passive'];
    data_display.appendChild(header);
    let tab = document.createElement('table');
    let headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    for (let h of ['Present', 'Imperfective', 'Aorist', "Future", 'Perfect', 'Pluperfect']) {
        let th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    }
    tab.appendChild(headerRow);
    for (let voice of voices) {
        console.log(voice);
        let row = document.createElement('tr');
        let rowTitle = document.createElement('td');
        rowTitle.textContent = voiceNames[counter];
        row.appendChild(rowTitle);
        counter += 1;
        for (let tense of sortByTense(voice)) {
            let cell = document.createElement('td');
            for (let form of tense) {
                let sp = document.createElement('span');
                sp.classList.add('form');
                sp.textContent = form[0];
                cell.appendChild(sp);
            }
            row.appendChild(cell);
        }
        tab.appendChild(row);
    }
    data_display.appendChild(tab);
}
function verby(xs) {
    let counter = 0;
    let moodNames = ['Indicative', 'Subjunctive', "Optative", 'Imperative', 'Infinitive'];
    let numberNames = ['1sg', '2sg', '3sg', '2d', '3d', '1pl', '2pl', '3pl'];
    let tenseNames = ['Present', 'Imperfective', 'Aorist', "Future", 'Perfect', 'Pluperfect'];
    let voiceNames = ['Active', 'Medio-passive', 'Middle', 'Passive'];
    let moods = sortByMood(flattenVerbs(xs));
    for (let mood of moods) {
        let header = document.createElement('h1');
        header.textContent = moodNames[counter];
        data_display.appendChild(header);
        counter += 1;
        let actPas = sortByVoice(mood);
        let z = 0;
        for (let voice of actPas) {
            let h = document.createElement('h2');
            h.textContent = voiceNames[z];
            z += 1;
            data_display.appendChild(h);
            let tab = document.createElement('table');
            let personNumber = sortByPersonNumber(voice);
            let headerRow = document.createElement('tr');
            headerRow.appendChild(document.createElement('td'));
            for (let n of tenseNames) {
                let nameCell = document.createElement('th');
                nameCell.textContent = n;
                headerRow.appendChild(nameCell);
            }
            tab.append(headerRow);
            let i = 0;
            for (let pn of personNumber) {
                let r = document.createElement('tr');
                let name = document.createElement('td');
                name.textContent = numberNames[i];
                i += 1;
                r.appendChild(name);
                let tense = sortByTense(pn);
                if (isNotEmpty(tense)) {
                    for (let t of tense) {
                        let cell = document.createElement('td');
                        for (let form of t) {
                            let sp = document.createElement('span');
                            sp.classList.add('form');
                            sp.textContent = form[0];
                            cell.appendChild(sp);
                        }
                        r.appendChild(cell);
                    }
                }
                tab.appendChild(r);
            }
            data_display.appendChild(tab);
        }
    }
}
function isNotEmpty(xs) {
    let i = 0;
    let counts = xs.reduce((x, cur) => cur + x.length, i);
    if (counts == 0) {
        return false;
    }
    return true;
}
function sortWord(xs) {
    let nouns = [];
    let verbs = [];
    let parts = [];
    let adjectives = [];
    let infs = [];
    let other = [];
    xs.forEach(function (w) {
        let form = w[0];
        let ns = [];
        let adj = [];
        let vs = [];
        let infinitives = [];
        let ps = [];
        let oth = [];
        w[1].forEach((z) => {
            let pos = z[0];
            switch (pos) {
                case "t":
                    ns.push(z);
                    break;
                case "n":
                    ns.push(z);
                    break;
                case "a":
                    adj.push(z);
                case "v":
                    if (z[4] == "n") {
                        infinitives.push(z);
                    }
                    else {
                        vs.push(z);
                    }
                    break;
                default:
                    oth.push(z);
            }
        });
        if (ns.length > 0) {
            nouns.push([form, ns]);
        }
        if (vs.length > 0) {
            verbs.push([form, vs]);
        }
        if (oth.length > 0) {
            other.push([form, oth]);
        }
        if (infinitives.length > 0) {
            infs.push([form, infinitives]);
        }
        if (ps.length > 0) {
            parts.push([form, ps]);
        }
        if (adj.length > 0) {
            adjectives.push([form, adj]);
        }
    });
    return [nouns, adjectives, verbs, parts, other, infs];
}
function searchData() {
    let lemma = search_box.value.normalize("NFC");
    data_display.innerHTML = "";
    if (!(lemma in data)) {
        let res = document.createElement('p');
        res.textContent = "Not found";
        data_display === null || data_display === void 0 ? void 0 : data_display.appendChild(res);
    }
    else {
        let words = data[lemma];
        //TODO sort by verby things and nouny things an dother things 
        let [nouns, adjs, verbs, parts, other, inf] = sortWord(Object.entries(words));
        if (nouns.length > 0) {
            nouny(Object.entries(nouns));
        }
        if (adjs.length > 0) {
            nouny(Object.entries(adjs));
        }
        if (parts.length > 0) {
            for (let t of sortByTense(parts)) {
                for (let v of sortByVoice(t)) {
                    nouny(Object.entries(v));
                }
            }
        }
        if (verbs.length > 0) {
            verby(verbs);
        }
        if (inf.length > 0) {
            display_infinitives(inf);
        }
    }
}
function autocomplete(input, list) {
    console.log(list);
    //Add an event listener to compare the input value with all countries
    input.addEventListener('input', function () {
        //Close the existing list if it is open
        closeList();
        //If the input is empty, exit the function
        if (!this.value)
            return;
        //Create a suggestions <div> and add it to the element containing the input field
        let suggestions = document.createElement('div');
        suggestions.setAttribute('id', 'suggestions');
        this.parentNode.appendChild(suggestions);
        //Iterate through all entries in the list and find matches
        for (let i = 0; i < list.length; i++) {
            if (list[i].toUpperCase().includes(this.value.toUpperCase())) {
                //If a match is foundm create a suggestion <div> and add it to the suggestions <div>
                let suggestion = document.createElement('div');
                suggestion.innerHTML = list[i];
                suggestion.addEventListener('click', function () {
                    input.value = this.innerHTML;
                    closeList();
                });
                suggestion.style.cursor = 'pointer';
                suggestions.appendChild(suggestion);
            }
        }
    });
    function closeList() {
        let suggestions = document.getElementById('suggestions');
        if (suggestions)
            suggestions.parentNode.removeChild(suggestions);
    }
}

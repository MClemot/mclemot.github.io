const titles = [
  "La Fortune des Rougon",
  "La Curée",
  "Le Ventre de Paris",
  "La Conquête de Plassans",
  "La Faute de l'abbé Mouret",
  "Son Excellence Eugène Rougon",
  "L'Assommoir",
  "Une page d'amour",
  "Nana",
  "Pot-Bouille",
  "Au Bonheur des dames",
  "La Joie de vivre",
  "Germinal",
  "L'Œuvre",
  "La Terre",
  "Le Rêve",
  "La Bête humaine",
  "L'Argent",
  "La Débâcle",
  "Le Docteur Pascal"
];

const texts = [];

init();

function init() {
    download().then(r => {
        let entry = document.getElementById('word');
        document.getElementById("container").innerHTML = "";
        entry.oninput = function() {
            find(entry.value)
        }
        entry.oninput()
    } )
}

async function download() {
    for (let i = 1; i <= 20; i++) {
        document.getElementById("container").innerHTML = `Chargement: ${i-1}/20`;
        const file = `zolastats/zola-${String(i).padStart(2, "0")}.txt`;
        const response = await fetch(file);
        const data = await response.text();
        texts.push(data);
    }
}

function find(entry) {
    const datas = [];

    for (const word of entry.split(",")) {
        let counts = [];
        for (let i = 1; i <= 20; i++) {
            const data = texts[i-1];
            let count = 0;
            if (word !== "") {
                const regex = new RegExp(word, "g");
                const matches = data.match(regex);
                count += matches ? matches.length : 0;
            }
            counts.push(count);
        }

        const data = {
            x: titles,
            y: counts,
            name: word,
            type: 'bar'
        };
        datas.push(data)
    }

    const layout = {barmode: 'group'};
    Plotly.newPlot('container', datas, layout);
}
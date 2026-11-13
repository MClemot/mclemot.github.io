document.addEventListener('wheel', (e) => {
    if (!Reveal.isOverview()) return;          // only in the ESC overview
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta > 0) Reveal.right();
    else if (delta < 0) Reveal.left();
}, { passive: false });

Reveal.initialize({
    hash: true,
    width: 1920,
    height: 1080,
    slideNumber: slide => [Reveal.getIndices(slide).h + 1, '/', Reveal.getHorizontalSlides().length],
    plugins: [RevealMath.KaTeX],
    margin: 0,
    center: false,
    transition: 'fade',
    transitionSpeed: 'fast',
    autoAnimateDuration: 0.5,
    katex: {
        macros: {
            // Basic dimensions / parameters
            "\\ddim": "d",
            "\\hdim": "k",
            "\\numb": "n",
            "\\npar": "p",
            "\\crit": "q",
            "\\field": "\\mathbb{k}",

            // Blackboard bold
            "\\bbi": "\\mathbb{I}",
            "\\bbk": "\\mathbb{K}",
            "\\bbm": "\\mathbb{M}",
            "\\bbn": "\\mathbb{N}",
            "\\bbr": "\\mathbb{R}",
            "\\bbs": "\\mathbb{S}",
            "\\bbv": "\\mathbb{V}",
            "\\bbw": "\\mathbb{W}",
            "\\bbz": "\\mathbb{Z}",

            // Calligraphic
            "\\calb": "\\mathcal{B}",
            "\\calc": "\\mathcal{C}",
            "\\cald": "\\mathcal{D}",
            "\\calf": "\\mathcal{F}",
            "\\calh": "\\mathcal{H}",
            "\\cali": "\\mathcal{I}",
            "\\calk": "\\mathcal{K}",
            "\\call": "\\mathcal{L}",
            "\\calm": "\\mathcal{M}",
            "\\caln": "\\mathcal{N}",
            "\\calo": "\\mathcal{O}",
            "\\calp": "\\mathcal{P}",
            "\\calr": "\\mathcal{R}",
            "\\cals": "\\mathcal{S}",
            "\\calw": "\\mathcal{W}",
            "\\calx": "\\mathcal{X}",
            "\\calz": "\\mathcal{Z}",

            // Operators
            "\\conv": "\\operatorname{conv}",
            "\\Ima": "\\operatorname{Im}",
            "\\id": "\\operatorname{id}",
            "\\lens": "\\operatorname{Lens}",
            "\\llens": "\\operatorname{LeftLens}",
            "\\rlens": "\\operatorname{RightLens}",
            "\\link": "\\operatorname{Lk}",
            "\\meb": "\\operatorname{meb}",
            "\\nrv": "\\operatorname{nrv}",
            "\\rank": "\\operatorname{rk}",
            "\\Star": "\\operatorname{St}",
            "\\vor": "\\operatorname{Vor}",
            "\\catsimp": "\\operatorname{Simp}",
            "\\catvect": "\\operatorname{Vect}",

            // Geometry
            "\\mst": "\\mathsf{MST}",
            "\\rng": "\\mathsf{RNG}",
            "\\ug": "\\mathsf{UG}",
            "\\del": "\\mathsf{DEL}",
            "\\mml": "\\mathsf{MML}",

            "\\skeleton": "{#1}^{({#2})}",
            "\\simplicesofdim": "{#1}^{#2}",

            // Filtrations
            "\\ripsf": "\\mathcal{R}_{#1}",
            "\\ball": "B",

            // Homology
            "\\PH": "\\text{PH}^{#1}",
            "\\chain": "\\calc_{#1}",
            "\\cycle": "\\calz_{#1}",
            "\\bound": "\\calb_{#1}",
            "\\homol": "\\calh_{#1}",
            "\\betti": "\\beta_{#1}",
            "\\euler": "\\chi",

            // Persistence diagrams
            "\\dgm": "\\mathrm{dgm}^{#1}",
            "\\dgmrips": "\\mathrm{dgm}_{\\mathcal{R}}^{#1}",
            "\\augmented": "\\overline{#1}",

            // Distances
            "\\bottle": "\\mathrm{d_b}",
            "\\gromov": "\\mathrm{d_{GH}}",
            "\\hausdo": "\\mathrm{d_H}",
            "\\interl": "\\mathrm{d_I}",
            "\\wasser": "\\calw_{#1}",

            // TAE++
            "\\pc": "X",
            "\\lpc": "Z",
            "\\dimh": "h",
            "\\diml": "\\ell",
            "\\projection": "\\phi",

            "\\tAE": "\\mathrm{TopoAE}",
            "\\ltopoae": "\\mathcal{L}_{\\mathrm{TAE}}^{#1}",
            "\\lcascae": "\\mathcal{L}_{\\mathrm{CD}}^{#1}",
            "\\lcustom": "\\mathcal{L}_{#2}^{#1}",
            "\\critical": "\\pi^{#1}",

            "\\cascade": "\\operatorname{cascade}",
            "\\partner": "\\operatorname{partner}",
            "\\casc": "\\mathsf{CASC}",
            "\\skelcasc": "\\mathsf{GCS}",

            // Losses, colored as in the TAE.svg figure (--c-red, --c-blue;
            // KaTeX \textcolor does not accept var())
            "\\lossr": "\\textcolor{#493df5}{\\call_r}",
            "\\losst": "\\textcolor{#cf244b}{\\call_t}",

            // Double braces
            "\\llaccolade": "\\left\\{\\!\\left\\{",
            "\\rraccolade": "\\right\\}\\!\\right\\}"
        }
    }
});

const HOWEVER_PC = [
    [1, 0, 0],
    [0.5, 0.866, 0],
    [-0.48, 0.667, 0],
    [-0.73, -0.199, 0.433],
    [-0.48, -1.065, 0],
    [0.5, -0.866, 0]
];

function scatter3d_layout(scene = {}) {
    return {
        scene: Object.assign({
            xaxis: { title: "X" },
            yaxis: { title: "Y" },
            zaxis: { title: "Z" }
        }, scene),
        margin: { l: 0, r: 0, t: 0, b: 0 }
    };
}

function plot_small_cloud(points, elementId) {
    const trace = {
        x: points.map(p => p[0]),
        y: points.map(p => p[1]),
        z: points.map(p => p[2]),

        mode: "markers",
        type: "scatter3d",

        marker: {
            size: 6,
            color: "rgb(73, 61, 245)"
        }
    };

    const layout = scatter3d_layout({
        aspectmode: "data",
        camera: { eye: { x: 2.5, y: 2.5, z: 2.5 } }
    });

    Plotly.newPlot(elementId, [trace], layout, { displayModeBar: false });
}

plot_small_cloud(HOWEVER_PC, "plot-however");
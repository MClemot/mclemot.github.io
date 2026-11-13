// Progress bar consistent with the slide number: it advances by horizontal
// slides only (vertical slides keep the position of their parent stack), and
// a click on it jumps to the corresponding horizontal slide. Written as a
// plugin since only plugins get the deck's internal progress controller.
const HorizontalProgress = {
    id: 'horizontal-progress',
    init: deck => {
        deck.progress.update = function () {
            const total = deck.getHorizontalSlides().length;
            if (deck.getConfig().progress && this.bar)
                this.bar.style.transform = `scaleX(${total < 2 ? 0 : deck.getIndices().h / (total - 1)})`;
        };
        deck.getRevealElement().addEventListener('click', e => {
            const bar = e.target.closest('.progress');
            if (!bar || e.target.closest('.progress-marker')) return;
            e.stopPropagation(); e.preventDefault();  // skip reveal's handler (which counts all slides)
            const total = deck.getHorizontalSlides().length;
            const x = (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth;
            deck.slide(Math.min(Math.round(x * (total - 1)), total - 1));
        }, true);
    }
};

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
    // "current/total" counting horizontal slides only: vertical slides keep
    // the number of their parent stack.
    slideNumber: slide => [Reveal.getIndices(slide).h + 1, '/', Reveal.getHorizontalSlides().length],
    plugins: [RevealMath.KaTeX, RevealHighlight, HorizontalProgress],
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

            // Arrows
            "\\collapses": "\\searrow",
            "\\inclusion": "\\hookrightarrow",
            "\\bijection": "\\overset{\\mathrm{bij}}{\\to}",

            // Geometry
            "\\mst": "\\mathsf{MST}",
            "\\rng": "\\mathsf{RNG}",
            "\\ug": "\\mathsf{UG}",
            "\\del": "\\mathsf{DEL}",
            "\\mml": "\\mathsf{MML}",

            // Čech / filtrations
            "\\cech": "\\v{C}",
            "\\deln": "\\mathcal{D}",
            "\\cechn": "\\mathcal{\\check{C}}",
            "\\delcechn": "\\mathcal{D\\check{C}}",
            "\\ripsn": "\\mathcal{R}",
            "\\delripsn": "\\mathcal{DR}",

            "\\offsetf": "\\mathcal{O}_{#1}",
            "\\cechf": "\\mathcal{\\check{C}}_{#1}",
            "\\delcechf": "\\mathcal{D\\check{C}}_{#1}",
            "\\alphaf": "\\mathcal{D}_{#1}",
            "\\ripsf": "\\mathcal{R}_{#1}",
            "\\delripsf": "\\mathcal{DR}_{#1}",

            "\\skeleton": "{#1}^{({#2})}",
            "\\simplicesofdim": "{#1}^{#2}",
            "\\offset": "{#1}^{\\oplus #2}",

            // Homology
            "\\PH": "\\text{PH}^{#1}",
            "\\chain": "\\calc_{#1}",
            "\\cycle": "\\calz_{#1}",
            "\\bound": "\\calb_{#1}",
            "\\homol": "\\calh_{#1}",
            "\\betti": "\\beta_{#1}",
            "\\euler": "\\chi",

            "\\HG": "\\calh_{\\hdim}(\\calk_{#1})",
            "\\PHG": "\\calh_{\\hdim}^{#1,#2}(\\calf)",
            "\\morphism": "f_{\\hdim}^{#1,#2}",

            "\\hgf": "\\calh_{#1}(#2_{#3})",
            "\\hgfx": "\\calh_{#1}(#2_{#3}(#4))",
            "\\hgdr": "V_{#3}(#4)",

            // Persistence diagrams
            "\\dgm": "\\mathrm{dgm}^{#1}",
            "\\dgmcech": "\\mathrm{dgm}_{\\mathcal{\\check{C}}}^{#1}",
            "\\dgmrips": "\\mathrm{dgm}_{\\mathcal{R}}^{#1}",
            "\\dgmdr": "\\mathrm{dgm}_{\\mathcal{DR}}^{#1}",
            "\\dgmdc": "\\mathrm{dgm}_{\\mathcal{D\\check{C}}}^{#1}",
            "\\dgmflood": "\\mathrm{dgm}_{\\mathcal{F}}^{#1}",
            "\\augmented": "\\overline{#1}",

            // Distances
            "\\bottle": "\\mathrm{d_b}",
            "\\gromov": "\\mathrm{d_{GH}}",
            "\\hausdo": "\\mathrm{d_H}",
            "\\interl": "\\mathrm{d_I}",
            "\\matchd": "\\mathrm{d_{match}}",
            "\\wasser": "\\calw_{#1}",

            // TAE++
            "\\pc": "X",
            "\\lpc": "Z",
            "\\dimh": "h",
            "\\diml": "\\ell",
            "\\projection": "\\phi",

            "\\carriereMethod": "\\text{tAE+}\\calw^1",

            "\\datathreeblobs": "\\texttt{3Clusters}",
            "\\datatwist": "\\texttt{Twist}",
            "\\datakfour": "\\texttt{K\\_4}",
            "\\datakfive": "\\texttt{K\\_5}",
            "\\datacoil": "\\texttt{COIL-20-1}",
            "\\datamocap": "\\texttt{MoCap}",
            "\\datasinglecell": "\\texttt{SingleCell}",

            "\\tAE": "\\mathrm{TopoAE}",
            "\\ltopoae": "\\mathcal{L}_{\\mathrm{TAE}}^{#1}",
            "\\lcascae": "\\mathcal{L}_{\\mathrm{CD}}^{#1}",
            "\\lcustom": "\\mathcal{L}_{#2}^{#1}",
            "\\critical": "\\pi^{#1}",

            "\\ripsKiller": "e_{\\mml}",
            "\\dr": "\\operatorname{Del}",
            "\\DRKiller": "e_{\\dr}",
            "\\edgeMML": "e_{\\mml}",
            "\\deathValue": "\\delta_{\\mml}",
            "\\circumcircle": "\\calc",
            "\\timing": "t\\,(s)",

            "\\enc": "\\operatorname{enc}",
            "\\dec": "\\operatorname{dec}",
            "\\low": "\\operatorname{low}",
            "\\cascade": "\\operatorname{cascade}",
            "\\partner": "\\operatorname{partner}",
            "\\casc": "\\mathsf{CASC}",
            "\\skelcasc": "\\mathsf{GCS}",

            "\\metwasser": "\\operatorname{PD}\\calw^1",
            "\\metwasserzero": "\\operatorname{PD}\\calw^0",
            "\\metdistor": "\\mathfrak{D}",
            "\\TA": "\\operatorname{TA}",
            "\\LC": "\\operatorname{LC}",
            "\\Cont": "\\operatorname{Cont}",
            "\\Trust": "\\operatorname{Trust}",
            "\\LCMC": "\\operatorname{LCMC}",
            "\\MRRE": "\\operatorname{MRRE}",
            "\\RMSE": "\\operatorname{RMSE}",

            "\\metwasserd": "\\metwasser\\downarrow",
            "\\metwasserzerod": "\\metwasserzero\\downarrow",
            "\\metdistord": "\\metdistor\\downarrow",
            "\\TAd": "\\TA\\uparrow",
            "\\LCd": "\\LC\\uparrow",
            "\\Contd": "\\Cont\\uparrow",
            "\\Trustd": "\\Trust\\uparrow",
            "\\LCMCd": "\\LCMC",
            "\\MRREd": "\\MRRE",
            "\\RMSEd": "\\RMSE",

            // Del-Rips
            "\\jung": "j_{#1}",
            "\\ratio": "\\eta",

            "\\maprtodr": "\\phi_{#1}^{#2}",
            "\\mapxtoy": "\\phi_{#1}",
            "\\mapytox": "\\psi_{#1}",
            "\\mapgeoxtoy": "\\alpha_{#1}",
            "\\mapgeoytox": "\\beta_{#1}",

            "\\usc": "\\mathsf{US}^{#1}",
            "\\rnsc": "\\mathsf{RNS}^{#1}",
            "\\msa": "\\mathsf{MSA}^{#1}",
            "\\nmj": "\\mathsf{NM}^{#1}",
            "\\ddel": "\\mathsf{DEL}^{#1}",
            "\\poly": "\\mathsf{cells}^{#1}",

            "\\nsimp": "n_{#1}",
            "\\nsimpb": "n_{#1}^{\\mathrm{b}}",
            "\\lex": "\\prec_{\\mathrm{lex}}",
            "\\order": "\\prec_{#1}",
            "\\cof": "\\operatorname{cof}",

            // Sublevel Flood
            "\\dist": "\\mathrm{d}",
            "\\flood": "\\mathcal{F}",
            "\\cflood": "\\widetilde{\\mathcal{F}}",
            "\\fflood": "\\operatorname{fl}",
            "\\floodmodule": "\\mathbb{F}",
            "\\delaunaymodule": "\\mathbb{D}",
            "\\offsetmodule": "\\mathbb{O}",
            "\\cov": "\\operatorname{Cov}",
            "\\supp": "\\operatorname{supp}",
            "\\bigrades": "\\phi",
            "\\pareto": "\\operatorname{Pareto}",

            "\\ball": "B",
            "\\incr": "\\mathcal{I}",
            "\\np": "\\mathsf{NP}",
            "\\lipconst": "\\ell",
            "\\Xincr": "X_{\\leq #1}",
            "\\vstar": "\\mathrm{V}",
            "\\cell": "\\mathrm{C}",
            "\\oom": "\\mathrm{OOM}",

            // Double braces
            "\\llaccolade": "\\left\\{\\!\\left\\{",
            "\\rraccolade": "\\right\\}\\!\\right\\}"
        }
    }
});

document.querySelectorAll('.reveal .slides > section[data-marker-color]').forEach(section => {
    section.style.setProperty('--chapter-color', section.getAttribute('data-marker-color'));
});

// Footnotes (see custom.css): moved out of their section into .slides, so that
// "bottom: 0" is the bottom of the slide, and shown on their slide only.
Reveal.on('ready', () => {
    const slides = Reveal.getSlidesElement();
    const notes = [...slides.querySelectorAll('section .footnote')].map(note => {
        const section = note.closest('section');
        slides.appendChild(note);
        return [note, section];
    });
    const update = () => notes.forEach(([note, section]) =>
        note.classList.toggle('visible', section === Reveal.getCurrentSlide()));
    Reveal.on('slidechanged', update);
    update();
});

Reveal.on('ready', () => {
    const progressBar = document.querySelector('.reveal .progress');
    const total = Reveal.getHorizontalSlides().length;
    if (!progressBar || total < 2) return;

    document.querySelectorAll('.reveal .slides > section[data-marker-color]').forEach(section => {
        const { h } = Reveal.getIndices(section);
        const marker = document.createElement('div');
        marker.className = 'progress-marker';
        marker.style.left = (h / (total - 1) * 100) + '%';
        const color = section.getAttribute('data-marker-color');
        if (color) marker.style.background = color;
        marker.addEventListener('click', e => {
            e.stopPropagation();
            Reveal.slide(h);
        });
        progressBar.appendChild(marker);
    });
});
// Fixed headers (see custom.css): the header is pinned to the top of the
// slide and the rest of the content is centered in the space below it.
// Reveal centers each slide on the whole height by setting its "top", so that
// "top" is overridden here (whenever reveal sets it) and the header is shifted
// back up by the same amount.
// {
//     const slideHeight = Reveal.getConfig().height;
//     const headerSlides = [...document.querySelectorAll('.reveal.fixed-headers .slides section')]
//         .filter(s => s.firstElementChild?.matches('h2'));
//     const place = s => {
//         if (!s.style.top) return;  // not laid out by reveal (hidden, or not centered)
//         const header = s.firstElementChild;
//         const headerBottom = header.offsetHeight + 2 * parseFloat(getComputedStyle(header).marginTop);
//         const top = headerBottom + Math.max((slideHeight - headerBottom - s.scrollHeight) / 2, 0);
//         if (Math.abs(parseFloat(s.style.top) - top) > 0.5) s.style.top = `${top}px`;
//         header.style.setProperty('--header-top', `${-top}px`);
//     };
//     const observer = new MutationObserver(records => records.forEach(r => place(r.target)));
//     headerSlides.forEach(s => observer.observe(s, { attributes: true, attributeFilter: ['style'] }));
// }

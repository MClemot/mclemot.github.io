function load_scalar_field(name) {
    return new Promise((resolve, reject) => {
        Papa.parse("files/" + name, {
            download: true,
            header: false,
            dynamicTyping: true,

            complete: function (results) {
                const rows = results.data.filter(row => row.length === 4);

                const data = {
                    x: rows.map(row => row[0]),
                    y: rows.map(row => row[1]),
                    z: rows.map(row => row[2]),
                    f: rows.map(row => row[3])
                };

                resolve(data);
            },

            error: reject
        });
    });
}

function sliceColorscale(colorscale, start) {
    const slice = colorscale.slice(start);
    const t0 = slice[0][0];
    const tRange = slice[slice.length - 1][0] - t0;
    return slice.map(([t, color]) => [(t - t0) / tRange, color]);
}

const UNCOLORED = "#493df5";

// Layout shared by every 3D scatter plot, with extra `scene` settings.
function scatter3d_layout(scene = {}) {
    return {
        scene: Object.assign({
            xaxis: { title: "X" },
            yaxis: { title: "Y" },
            zaxis: { title: "Z" }
        }, scene),
        margin: { l: 0, r: 0, t: 0, b: 0 },
        paper_bgcolor: "#f0f1eb"
    };
}

function plot_scalar_field(data, elementId, colored = true) {
    const trace = {
        x: data.x,
        y: data.y,
        z: data.z,

        mode: "markers",
        type: "scatter3d",

        marker: {
            size: 2,
            color: colored ? data.f : UNCOLORED,
            colorscale: sliceColorscale(CUSTOM_COLORSCALE, 64),
            showscale: colored,
            colorbar: { thickness: 15, len: 0.6 }
        }
    };

    Plotly.newPlot(elementId, [trace], scatter3d_layout(), { displayModeBar: false });
}

function set_scalar_field_colored(data, elementId, colored) {
    Plotly.restyle(elementId, {
        "marker.color": [colored ? data.f : UNCOLORED],
        "marker.showscale": colored
    });
}

// Small point cloud of the "However" slide (TAE1 counter-example)
const HOWEVER_PC = [
    [1, 0, 0],
    [0.5, 0.866, 0],
    [-0.48, 0.667, 0],
    [-0.73, -0.199, 0.433],
    [-0.48, -1.065, 0],
    [0.5, -0.866, 0]
];

function plot_small_cloud(points, elementId) {
    const trace = {
        x: points.map(p => p[0]),
        y: points.map(p => p[1]),
        z: points.map(p => p[2]),

        mode: "markers",
        type: "scatter3d",

        marker: {
            size: 6,
            color: UNCOLORED
        }
    };

    const layout = scatter3d_layout({
        aspectmode: "data",
        camera: { eye: { x: 2.5, y: 2.5, z: 2.5 } }
    });

    Plotly.newPlot(elementId, [trace], layout, { displayModeBar: false });
}

async function load() {
    plot_small_cloud(HOWEVER_PC, "plot-however");

    const sphere = await load_scalar_field("example_sphere_pts.csv");
    plot_scalar_field(sphere, "plot-sphere", false);

    Reveal.on('fragmentshown', (event) => {
        if (event.fragment.id == "sphere-color")
            set_scalar_field_colored(sphere, "plot-sphere", true);
    });
    Reveal.on('fragmenthidden', (event) => {
        if (event.fragment.id == "sphere-color")
            set_scalar_field_colored(sphere, "plot-sphere", false);
    });

    const torus = await load_scalar_field("example_torus_pts.csv");
    plot_scalar_field(torus, "plot-torus");
}

load();
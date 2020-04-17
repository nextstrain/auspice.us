# Auspice.us

Auspice.us, pronounced "auspicious" (/ɔːˈspɪʃəs/), is an interactive web-app for visualising phylogenomic datasets.
It allows interactive exploration of phylogenomic datasets by simply dragging & dropping them onto the browser.


Auspice.us uses Nextstrain, an open-source project to harness the scientific and public health potential of pathogen genome data.
For more information about how to run the bioinformatics tools which this tool can visualise please see [the Nextstrain docs](https://nextstrain.org/docs/bioinformatics/introduction-to-augur).
For more information about the software which powers these visualisations please see [the Auspice documentation](https://nextstrain.github.io/auspice/).

It is currently available at [auspice-us-dev.herokuapp.com](http://auspice-us-dev.herokuapp.com/).


## How to build the site locally

Ensure you have nodejs available.
You can use the provided conda environment if desired:

```bash
conda env create -f environment.yml
conda activate auspice.us
```

Install the dependencies, build & run via:

```bash
npm install
npm run build
npm run view
```

There is also a development server available, `npm run develop`.

## Getting JSONs to test with

You can download some datasets from Nextstrain to test with via:

```
curl http://data.nextstrain.org/zika.json --compressed -o data/zika.json;
curl http://data.nextstrain.org/ncov_global.json --compressed -o data/ncov_global.json;
```


## Deploy:

> This needs updating

```bash
git push -f auspice-us-dev extend:master
```

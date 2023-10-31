# Auspice.us

Auspice.us, pronounced "auspicious" (/ɔːˈspɪʃəs/), is an interactive web-app for visualising phylogenomic datasets.
It allows interactive exploration of phylogenomic datasets by simply dragging & dropping them onto the browser.


Auspice.us uses Nextstrain, an open-source project to harness the scientific and public health potential of pathogen genome data.
For more information about how to run the bioinformatics tools which this tool can visualise please see [the Nextstrain docs](https://nextstrain.org/docs/bioinformatics/introduction-to-augur).
For more information about the software which powers these visualisations please see [the Auspice documentation](https://nextstrain.github.io/auspice/).

It is available at [auspice.us](http://auspice.us).


## How to build the site locally

Ensure you have Node.js available, specifically the version defined in package.json.

Install the dependencies, build & run via:

```bash
npm install
npm run build
npm run start
```

There is also a development server available via `npm run develop`.

## Getting JSONs to test with

You can download some datasets from Nextstrain to test with via:

```
curl http://data.nextstrain.org/zika.json --compressed -o data/zika.json;
curl http://data.nextstrain.org/ncov_global.json --compressed -o data/ncov_global.json;
```


## Deploy

Deployments are handled by a Heroku pipeline connected to GitHub under the nextstrain-bot user account. The following apps are used:

### Review Apps

Heroku automatically creates a review app for each opened PR that isn't from a fork. These are based on configuration in [app.json](./app.json).

### Production

There is one production app configured to auto-deploy from `master`. The DNS is configured to serve the app at https://auspice.us.

Note that changes to [app.json](./app.json) only affect newly deployed apps. In practice, this means it will work fine for new review apps, but changes must be manually applied to the existing production app.

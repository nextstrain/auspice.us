# Auspice.us

> Auspice.us is currently under development and not for public release

Auspice.us, pronounced "auspicious" (/ɔːˈspɪʃəs/), is an interactive web-app for visualising phylogenomic datasets.
It is currently available at [auspice-us-dev.herokuapp.com](http://auspice-us-dev.herokuapp.com/).

## How to build


```bash
conda activate auspice.us
npm install
npx auspice build --verbose --extend ./auspice_client_customisation/config.json
npx auspice view --verbose --handlers ./server/server.js
```


```bash
npx auspice develop --verbose --extend ./auspice_client_customisation/config.json --handlers ./server/server.js
```




## Deploy:
```bash
git push -f auspice-us-dev extend:master
```

Heroku performs these steps:
1. It runs the `npm run heroku-postbuild` hook, which which builds auspice.us now, not auspice (see above command).
1. The Procfile uses the auspice.us handlers (see above command).

Note that due to the dependencies / devdependiencies being in flux, we've set `heroku config:set NPM_CONFIG_PRODUCTION=false --remote auspice-us-dev` so that installs (and keeps) all dependencies.

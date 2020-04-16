# Auspice.us

> Auspice.us is currently under development and not for public release

Auspice.us, pronounced "auspicious" (/ɔːˈspɪʃəs/), is an interactive web-app for visualising phylogenomic datasets.
It is currently available at [auspice-us-dev.herokuapp.com](http://auspice-us-dev.herokuapp.com/).

## How to build

Currently located as a subfolder of auspice — however this could be broken out into its own repo if needed. 
All commands run from the "auspice" directory.

```bash
# DEVELOPMENT
node auspice.js develop --verbose --extend ./auspice.us/config.json --handlers ./auspice.us/server.js 

# PRODUCTION
node auspice.js build --verbose --extend ./auspice.us/config.json
node auspice.js view --verbose --handlers ./auspice.us/server.js
```

## Deploy:
```bash
git push -f auspice-us-dev extend:master
```

Heroku performs these steps:
1. It runs the `npm run heroku-postbuild` hook, which which builds auspice.us now, not auspice (see above command).
1. The Procfile uses the auspice.us handlers (see above command).

Note that due to the dependencies / devdependiencies being in flux, we've set `heroku config:set NPM_CONFIG_PRODUCTION=false --remote auspice-us-dev` so that installs (and keeps) all dependencies.

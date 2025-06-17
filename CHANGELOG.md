# CHANGELOG

> Note that updates to the version of Auspice used do not generally result in updates to the auspice.us version.
> In the [auspice.us](https://auspice.us) splash-page footer you can see both the auspice.us and Auspice versions in use.

### Version 0.13.0 (2025-06-18)

> Note: We went three years without updating the auspice.us version! These are the changes between the 0.12.0 release and the 0.13.0 release:


* Fixed a bug where a narrative and its datasets were not correctly linked ([PR 36](https://github.com/nextstrain/auspice.us/pull/36)).
* Parse measurement sidecar files ([PR 57](https://github.com/nextstrain/auspice.us/pull/57), [PR 107](https://github.com/nextstrain/auspice.us/pull/107)).
* Switched to a new Newick parser and then reverted this change. As part of these changes we no longer allow newick trees with quotes. ([PR 69](https://github.com/nextstrain/auspice.us/pull/69), [PR 73](https://github.com/nextstrain/auspice.us/pull/73)).
* Add file picker to splash page ([PR 77](https://github.com/nextstrain/auspice.us/pull/77)).
* Improve splash page wording to clarify supported files ([PR 75](https://github.com/nextstrain/auspice.us/pull/75)).
* Support gzip (`.gz`) compressed JSONs ([PR 114](https://github.com/nextstrain/auspice.us/pull/114)).
* Support `.auspicejson` and `.gzip` file extensions ([PR 129](https://github.com/nextstrain/auspice.us/pull/129)).

_Internal changes_

* Auspice updates are now automated via dependabot ([PR 32](https://github.com/nextstrain/auspice.us/pull/32)).
* Heroku updates ([PR 33](https://github.com/nextstrain/auspice.us/pull/33), [PR 34](https://github.com/nextstrain/auspice.us/pull/34)).
* Updated to Node.js v16 ([PR 40](https://github.com/nextstrain/auspice.us/pull/40)).
* Simplify build instructions ([PR 68](https://github.com/nextstrain/auspice.us/pull/68)).
* Added basic CI via GitHub Actions ([PR 76](https://github.com/nextstrain/auspice.us/pull/76)).
* Updated to Node.js v20 ([PR 81](https://github.com/nextstrain/auspice.us/pull/81)).
* Add linting and enforce it via CI ([PR 127](https://github.com/nextstrain/auspice.us/pull/127)).


### Version 0.12.0 (2022-03-28)

* Newick branch lengths now default to 0 if unspecified ([PR 27](https://github.com/nextstrain/auspice.us/pull/27)).

### Version 0.11.0 (2022-02-22)

Improved dataset loading functionality ([PR 23](https://github.com/nextstrain/auspice.us/pull/23)).
* Sidecar files can now be loaded.
* Two datasets can be loaded, but this functionality is not particularly useful as there is no way to order the trees.
* A narrative (markdown) can be loaded, as long as they are dragged together with the datasets they reference.


### Version 0.10.0 (2022-02-22)

* Fixed misleading error notifications when dragging on metadata files ([PR 16](https://github.com/nextstrain/auspice.us/pull/16)).

### Version 0.9.0 (2022-02-22)

* Upgraded auspice to 2.33.0

### Version 0.8.0 (2021-09-16)

* Upgraded auspice to 2.31.0

### Version 0.8.0 (2021-07-16)

* Upgraded auspice to 2.29.1

### Version 0.6.0 (2021-06-01)

* Upgraded auspice to 2.26.0

### Version 0.5.0 (2021-01-29)

* Upgraded auspice to 2.23.0
* [dev] Updated conda environment

### Version 0.4.0 (2020-11-24)

* Upgraded auspice to 2.20.1

### Version 0.3.0 (2020-08-26)

* Upgraded auspice to 2.18.1
* Automatically redirect http://auspice.us to https://auspice.us
* Add entry to splash page surfacing the ability to drag & drop metadata in CSV/TSV format

### Version 0.2.0 (2020-07-14)

* Upgraded auspice to 2.17.3
* Added support for Newick files
* Better error handling & display
* Updated splash page, including an explicit privacy notice
* Added this changelog

### Version 0.1.0

Initial implementation using Auspice version 2.12.0.
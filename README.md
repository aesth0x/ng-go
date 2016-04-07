# ng-go

V 1.1.0

ng-go is an Angular 2 Go game web app.

The demo is here -  http://yli.io/app/ng-go/ (Updated: 4/6/2016)

<img src="http://yli.io/app/ng-go/demo-2d.png" width="400">
<img src="http://yli.io/app/ng-go/demo-3d.png" width="400">

## Features

* Support new game and sgf import. 
* Step backward, step forward, and test play functions.
* Configurable game board dimension (1x1 ~ 26x26).
* Fancy 3D interactive game board built with three.js, support risizing and rotation.
* Game board is draw dynamically with svg, therefore no loss of resolution on resizing. 
* Go game rules implemented, except for ko. 

## Setup

Install the npm packages described in the package.json:

```bash
$ npm install
```
Transpile typescript into javascript, host the app and monitor the changes: 

```bash
$ npm start
```

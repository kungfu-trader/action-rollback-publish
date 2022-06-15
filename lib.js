/* eslint-disable no-restricted-globals */
const github = require('@actions/github');
const fse = require('fs-extra');
const path = require('path');
const git = require('git-client');
const { spawnSync } = require('child_process');

const spawnOpts = { shell: true, stdio: 'pipe', windowsHide: true };

exports.rollbackRelease = async function (argv) {
  const rootPackageJson = fse.readJSONSync('package.json');
  console.log(rootPackageJson);
  console.log(argv);
};

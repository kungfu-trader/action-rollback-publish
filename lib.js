/* eslint-disable no-restricted-globals */
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const git = require('git-client');
const { spawnSync } = require('child_process');

const spawnOpts = { shell: true, stdio: 'pipe', windowsHide: true };

function exec(cmd, args = [], opts = spawnOpts) {
  console.log('$', cmd, ...args);
  const result = spawnSync(cmd, args, opts);
  const output = result.output.filter((e) => e && e.length > 0).toString();
  console.log(output);
  if (result.status !== 0) {
    throw new Error(`Failed with status ${result.status}`);
  }
  return output;
}

async function gitCall(...args) {
  console.log('$ git', ...args);
  const output = await git(...args);
  console.log(output);
  return output;
}

exports.checkFormat = async function (argv) {
  console.log(argv);
  exec('yarn', ['run', 'format']);
  const gitStatus = await gitCall('status', '--short');
  if (gitStatus) {
    console.log('\n! found unformatted code');
    throw new Error(`Found unformatted code\n${gitStatus}`);
  }
};

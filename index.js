/* eslint-disable no-restricted-globals */
const lib = (exports.lib = require('./lib.js'));
const core = require('@actions/core');
const github = require('@actions/github');

const main = async function () {
  const context = github.context;
  const repo = github.context.repo;
  const argv = {
    token: core.getInput('token'),
    owner: repo.owner,
    repo: repo.repo,
  };
  await lib.rollbackRelease(argv);
};

if (require.main === module) {
  main().catch((error) => {
    console.log('test'); console.error(error);
    core.setFailed(error.message);
  });
}

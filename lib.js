/* eslint-disable no-restricted-globals */
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const git = require('git-client');
const { spawnSync } = require('child_process');

const spawnOpts = { shell: true, stdio: 'pipe', windowsHide: true };

exports.rollbackRelease = async function (argv) {
  console.log(argv);
  exports.solveAllPackages(argv);
};

exports.deletePublishedPackage = async function (token, repo, owner, names, deltVersion) {
  const octokit = github.getOctokit(token);
  const number = 1;
  const packageInfo = await octokit.graphql(`
    query {
      repository(name: "${repo}", owner: "${owner}") {
        packages(names: "${names}", last: ${number}) {
          edges {
            node {
              name
              versions(last:${number}) {
                edges {
                  node {
                    id
                    version
                  }
                }
              }
            }
          }
        }
      }
    }`);
  const edgesNumber = 0;
  const packageVersionId = packageInfo.repository.packages.edges[edgesNumber].node.versions.edges[edgesNumber].node.id;
  const packageVersion = packageInfo.repository.packages.edges[edgesNumber].node.versions.edges[edgesNumber].node.version;
  if (deltVersion == packageVersion) {
    await octokit.graphql(`
      mutation {
        deletePackageVersion(input: {packageVersionId: "${packageVersionId}"}) {
          success
        }
      }`)
  }
}

exports.solveAllPackages = async function (argv) {
  const result = spawnSync('yarn', ['-s', 'workspaces', 'info'], spawnOpts);
  const output = result.output.filter((e) => e && e.length > 0).toString();
  const workspaces = JSON.parse(output);
  for (const key in workspaces) {
    const workspace = workspaces[key];
    const names = workspace.name.split(['/'])[1];
    const version = workspace.version;
    await deletePublishedPackage(argv.token, argv.repo, argv.owner, names, version);
  }
}

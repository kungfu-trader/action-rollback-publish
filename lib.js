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
  await exports.solveAllPackages(argv);
};

exports.deletePublishedPackage = async function (token, repo, owner, names, delVersion) {
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
  if (delVersion == packageVersion) {
    await octokit.graphql(`
      mutation {
        deletePackageVersion(input: {packageVersionId: "${packageVersionId}"}) {
          success
        }
      }`);
  }
};

exports.solveAllPackages = async function (argv) {
  const result = spawnSync('yarn', ['-s', 'workspaces', 'info'], spawnOpts);
  const outputStr = result.output.filter((e) => e && e.length > 0).toString();
  const output = JSON.parse(outputStr);
  //console.log(output);
  for (const key in output) {
    console.log(`package path is: ${output[key].location}`);
    const processPath = process.cwd();
    console.log(`process path is: ${processPath}`);
    const packagePath = path.join(processPath, output[key].location);
    const package = path.join(packagePath, 'package.json');
    console.log(`the package.json path is: ${package}`);
    const config = JSON.parse(fse.readFileSync(package));
    const names = config.name.split(['/'])[1];
    const delVersion = config.version;
    console.log(`---deleting package: ${names}(version:${delVersion})---`);
    await exports.deletePublishedPackage(argv.token, argv.repo, argv.owner, names, delVersion);
    console.log(`---deleted package: ${names}(version:${delVersion})---\n\n`);
  }
};

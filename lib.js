/* eslint-disable no-restricted-globals */
const github = require('@actions/github');
const fse = require('fs-extra');
const path = require('path');
const git = require('git-client');
const { spawnSync } = require('child_process');

const spawnOpts = { shell: true, stdio: 'pipe', windowsHide: true };

exports.rollbackRelease = async function (argv) {
  console.log(`token:${argv.token}`);
  const rootPackageJson = fse.readJSONSync('package.json');
  console.log(rootPackageJson);
  console.log(argv);
  await exports.solveAllPackages(argv);
};

exports.deletePublishedPackage = async function (token, repo, owner, names, delVersion) {
  const octokit = github.getOctokit(token);
  const number = 1;
  console.log('-----start finding packages!!!');
  const packageInfo = await octokit.graphql(`
    query {
      repository(name: "${repo}", owner: "${owner}") {
        packages(names: "${names}", first: ${number}) {
          edges {
            node {
              name
              versions(first:${number}) {
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
  const packageVersion =
    packageInfo.repository.packages.edges[edgesNumber].node.versions.edges[edgesNumber].node.version;
  console.log('-----start deleting packages!!!');
  console.log(`delVersion:${delVersion}`);
  console.log(`packageVersion:${packageVersion}`);
  if (delVersion == packageVersion) {
    const deletePkg = await octokit.graphql(
      `
        mutation {
          deletePackageVersion(input: {packageVersionId: "${packageVersionId}"}) {
            success
          }
        }`,
      { headers: { accept: `application/vnd.github.package-deletes-preview+json` } },
    );
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
    console.log(`---Deleting package: ${names}(version:${delVersion})---`);
    await exports.deletePublishedPackage(argv.token, argv.repo, argv.owner, names, delVersion);
    console.log(`---Already has deleted package: ${names}(version:${delVersion})---\n\n`);
  }
};

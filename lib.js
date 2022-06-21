/* eslint-disable no-restricted-globals */
const github = require('@actions/github');
const fse = require('fs-extra');
const path = require('path');
const git = require('git-client');
const semver = require('semver');
const { spawnSync } = require('child_process');

const spawnOpts = { shell: true, stdio: 'pipe', windowsHide: true };

function hasLerna(cwd) {
  return fse.existsSync(path.join(cwd, 'lerna.json'));
}

function getCurrentVersion(cwd) {
  const configPath = path.join(cwd, hasLerna(cwd) ? 'lerna.json' : 'package.json');
  const config = JSON.parse(fse.readFileSync(configPath));
  return semver.parse(config.version);
}

async function gitCall(...args) {
  console.log('$ git', ...args);
  const output = await git(...args);
  console.log(output);
  return output;
}

function hasLerna(cwd) {
  return fse.existsSync(path.join(cwd, 'lerna.json'));
}

function getCurrentVersion(cwd) {
  const configPath = path.join(cwd, hasLerna(cwd) ? 'lerna.json' : 'package.json');
  const config = JSON.parse(fse.readFileSync(configPath));
  return semver.parse(config.version);
}

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
<<<<<<< HEAD

  await exports.createNewPullRequest(argv);
};

exports.createNewPullRequest = async function (argv) {
  const pkgsWorkspace = spawnSync('yarn', ['-s', 'workspaces', 'info'], spawnOpts);
  const workspaceStr = pkgsWorkspace.output.filter((e) => e && e.length > 0).toString();
  const output = JSON.parse(workspaceStr);
=======
  await exports.createNewPullRequest(output, argv);
};

exports.createNewPullRequest = async function (output, argv) {
>>>>>>> 194c97fa365fa96d67d69450a91cdc79279a2000
  const processCwd = process.cwd();
  const currentVersion = getCurrentVersion(processCwd);
  const versionRef = `v${currentVersion.major}/v${currentVersion.major}.${currentVersion.minor}`;
  const devChannel = `dev/${versionRef}`;
  //await gitCall('fetch');
  await gitCall('switch', devChannel); // `origin/${devChannel}`
  await gitCall('pull');

  const octokit = github.getOctokit(argv.token);
  const lastMergedPullRequestInfo = await octokit.graphql(`
    query {
      repository(name: "${argv.repo}", owner: "${argv.owner}") {
        id
        url
        pullRequests(last: 1, states: MERGED) {
          nodes {
            id
            state
            number
            title
          }
        }
      }
    }`);
  const number = lastMergedPullRequestInfo.repository.pullRequests.nodes[0].number;
  const url = lastMergedPullRequestInfo.repository.url;
  const id = lastMergedPullRequestInfo.repository.id;
  const title = lastMergedPullRequestInfo.repository.pullRequests.nodes[0].title;
  const headId = await gitCall('rev-parse', 'HEAD');
  const repositoryNameWithOwner = argv.owner + '/' + argv.repo;
  console.log(`---------The branch now is pointing to ${headId}`);
  console.log(`---------RepositoryNameWithOwner:${repositoryNameWithOwner}`);
  for (const key in output) {
    console.log(`\npackage path is: ${output[key].location}`);
    const processPath = process.cwd();
    console.log(`process path is: ${processPath}\n`);
    const packagePath = path.join(processPath, output[key].location);
    const package = path.join(packagePath, 'package.json');
    //const package = path.join(processCwd, output[key].location, 'package.json');
    const config = JSON.parse(fse.readFileSync(package));
    const info = {
      names: config.name.split(['/'])[1],
      delVersion: config.version,
      package: package,
      config: config,
    };
    if (!config.repository) {
      config.repository = {
        url: `${url}.git`,
      };
      //fse.writeFileSync(info.package, JSON.stringify(info.config, null, '\t'));
      fse.writeFileSync(info.package, JSON.stringify(info.config, null, 2));
    }
  }
  await gitCall('add', '.');
  await gitCall('commit', '-m', 'test');
  await gitCall('push');
  //await gitCall('push', 'origin', `HEAD:${devChannel}`);
  //await gitCall('switch', argv.baseRef);
  console.log(`---Merged pr [${title}](pr number:[${number}]) failed. Creating new open pr...`);
  console.log(`repo id:[${id}]`);
  console.log(`baseRef:[${argv.baseRef}]`);
  console.log(`headRef:[${argv.headRef}]`);
  console.log(`New pr title:[${title}]`);
  const newPullRequest = await octokit.graphql(`
    mutation {
      createPullRequest(input: {repositoryId: "${id}", baseRefName: "${argv.baseRef}", headRefName: "${argv.headRef}", title: "${title}"}) {
        clientMutationId
      }
    }`);
  console.log(`New pr has created, which is:[${title}](${argv.headRef}--->${argv.baseRef});`);
};

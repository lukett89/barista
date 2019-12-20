/**
 * @license
 * Copyright 2019 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BuilderOutput, BuilderContext } from '@angular-devkit/architect';
import { PackagerOptions } from './schema';
import { bold, green, red, italic } from 'chalk';
import { join } from 'path';
import { tryJsonParse, PackageJson } from '../util/json-utils';
import { parseVersionName, Version, GitClient } from '../util/release';
import { verifyPublishBranch } from '../util/release/publish-branch';

/**
 * This builder downloads the CI
 */
export async function publishRelease(
  options: PackagerOptions,
  context: BuilderContext,
): Promise<BuilderOutput> {
  const project = context.target !== undefined ? context.target!.project : '';

  const git = new GitClient(context.workspaceRoot);

  context.logger.info('');
  context.logger.info(green('----------------------------------------------'));
  context.logger.info(
    green(bold(`  Dynatrace Barista ${project} release script`)),
  );
  context.logger.info(green('----------------------------------------------'));
  context.logger.info('');

  try {
    // determine version
    const version = await determineVersion(context);

    // verify uncommited changes
    verifyUncommitedChanges(git);

    // verify publish branch
    verifyPublishBranch(version, git);

    // get last commit from branch
    verifyLocalCommitsMatchRemote(git);

    // request build id for commit on remote

    // check that the build was successful

    // download artifact from circle

    // check release bundle (verify version in package.json)

    // extract release notes

    // create release tag

    // push release tag to github

    // confirm npm publish

    // publish TADA!🥳
  } catch (err) {
    context.logger.error(err);
    return { success: false };
  }

  return { success: false };
}

async function determineVersion(context: BuilderContext): Promise<Version> {
  const packageJsonPath = join(context.workspaceRoot, 'package.json');

  let parsedVersion;

  const packageJson = await tryJsonParse<PackageJson>(packageJsonPath);

  parsedVersion = parseVersionName(packageJson.version);
  if (!parsedVersion) {
    throw new Error(
      `Cannot parse current version in ${italic('package.json')}. Please ` +
        `make sure "${this.packageJson.version}" is a valid Semver version.`,
    );
  }
  return parsedVersion;
}

function verifyUncommitedChanges(git: GitClient): void {
  if (git.hasUncommittedChanges()) {
    throw new Error(
      red(
        `  ✘   There are changes which are not committed and should be ` +
          `discarded.`,
      ),
    );
  }
}

function verifyLocalCommitsMatchRemote(git: GitClient): void {
  const currentBranch = git.getCurrentBranch();
  const localCommitSha = git.getLocalCommitSha('HEAD');
  const remoteCommitSha = git.getRemoteCommitSha(currentBranch);
  if (localCommitSha !== remoteCommitSha) {
    throw new Error(
      red(
        `  ✘ The current branch is not in sync with the remote branch. ` +
          `Please make sure your local branch "${italic(
            currentBranch,
          )}" is up to date.`,
      ),
    );
  }
}

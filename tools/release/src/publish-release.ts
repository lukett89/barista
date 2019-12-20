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

import { readFileSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { GitClient } from './git/git-client';
import { getGithubNewReleaseUrl } from './git/github-urls';
import { BaseReleaseTask } from './base-release';
import { red, italic, green, bold, yellow } from 'chalk';
import { CHANGELOG_FILE_NAME } from './stage-release';
import { Version, parseVersionName } from './parse-version';
import { extractReleaseNotes } from './extract-release-notes';
import { npmPublish } from './npm/npm-client';

/**
 * Class that can be instantiated in order to create a new release. The tasks requires user
 * interaction/input through command line prompts.
 */
class PublishReleaseTask extends BaseReleaseTask {
  /** Path to the release output of the project. */
  releaseOutputPath: string;

  constructor(
    public projectDir: string,
    public repositoryOwner: string,
    public repositoryName: string,
  ) {
    super(
      new GitClient(
        projectDir,
        `https://github.com/${repositoryOwner}/${repositoryName}.git`,
      ),
    );

    this.packageJsonPath = join(projectDir, 'package.json');
    this.releaseOutputPath = join(projectDir, 'dist/releases');

    this.packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf-8'));

    const parsedVersion = parseVersionName(this.packageJson.version);
    if (!parsedVersion) {
      console.error(
        red(
          `Cannot parse current version in ${italic('package.json')}. Please ` +
            `make sure "${this.packageJson.version}" is a valid Semver version.`,
        ),
      );
      process.exit(1);
      return;
    }
    this.currentVersion = parsedVersion;
  }

  async run(): Promise<void> {
    console.log();
    console.log(green('----------------------------------------------'));
    console.log(green(bold('  Dynatrace Barista components release script')));
    console.log(green('----------------------------------------------'));
    console.log();

    const newVersion = this.currentVersion;
    const newVersionName = this.currentVersion.format();

    // Ensure there are no uncommitted changes. Checking this before switching to a
    // publish branch is sufficient as unstaged changes are not specific to Git branches.
    // this.verifyNoUncommittedChanges();

    // Branch that will be used to build the output for the release of the current version.
    // const publishBranch = this.switchToPublishBranch(newVersion);

    // this._verifyLastCommitFromStagingScript();
    // this.verifyLocalCommitsMatchUpstream(publishBranch);

    const npmDistTag = 'Latest';

    // download the artifact from circle

    console.info(green(`  ✓   Downloaded the artifact from CI.`));

    // Checks all release packages against release output validations before releasing.
    // checkReleaseOutput(this.releaseOutputPath, this.currentVersion);

    // Extract the release notes for the new version from the changelog file.
    const extractedReleaseNotes = extractReleaseNotes(
      join(this.projectDir, CHANGELOG_FILE_NAME),
      newVersionName,
    );

    if (!extractedReleaseNotes) {
      console.error(
        red(`  ✘   Could not find release notes in the changelog.`),
      );
      process.exit(1);
    }

    const { releaseNotes, releaseTitle } = extractedReleaseNotes;

    // Create and push the release tag before publishing to NPM.
    this._createReleaseTag(newVersionName, releaseNotes);
    this._pushReleaseTag(newVersionName);

    // Just in order to double-check that the user is sure to publish to NPM, we want
    // the user to interactively confirm that the script should continue.
    await this._promptConfirmReleasePublish();
    this._publishPackageToNpm('barista-components', npmDistTag);

    const newReleaseUrl = getGithubNewReleaseUrl({
      owner: this.repositoryOwner,
      repository: this.repositoryName,
      tagName: newVersionName,
      releaseTitle: releaseTitle,
      // TODO: we cannot insert the real changelog here since the URL would become
      // way too large and Github would consider this as a malformed page request.
      body: 'Copy-paste changelog in here!',
    });

    console.log();
    console.info(green(bold(`  ✓   Published successfully`)));
    console.info(
      yellow(`  ⚠   Please draft a new release of the version on Github.`),
    );
    console.info(yellow(`      ${newReleaseUrl}`));

    // Remove file at ~/.npmrc after release is complete.
    unlinkSync(`${homedir()}/.npmrc`);
  }

  /**
   * Prompts the user whether he is sure that the script should continue publishing
   * the release to NPM.
   */
  private async _promptConfirmReleasePublish(): Promise<void> {
    if (
      !(await this.promptConfirm('Are you sure that you want to release now?'))
    ) {
      console.log();
      console.log(yellow('Aborting publish...'));
      process.exit(0);
    }
  }

  /** Publishes the specified package within the given NPM dist tag. */
  private _publishPackageToNpm(packageName: string, npmDistTag: string): void {
    console.info(green(`      Publishing "${packageName}"..`));

    const errorOutput = npmPublish(
      join(this.releaseOutputPath, packageName),
      npmDistTag,
    );

    if (errorOutput) {
      console.error(
        red(`  ✘   An error occurred while publishing "${packageName}".`),
      );
      console.error(
        red(
          `      Please check the terminal output and reach out to the team.`,
        ),
      );
      console.error(red(`\n${errorOutput}`));
      process.exit(1);
    }

    console.info(green(`  ✓   Successfully published "${packageName}"`));
  }

  /** Creates the specified release tag locally. */
  private _createReleaseTag(tagName: string, releaseNotes: string): void {
    if (this.git.hasLocalTag(tagName)) {
      const expectedSha = this.git.getLocalCommitSha('HEAD');

      if (this.git.getShaOfLocalTag(tagName) !== expectedSha) {
        console.error(
          red(
            `  ✘   Tag "${tagName}" already exists locally, but does not refer ` +
              `to the version bump commit. Please delete the tag if you want to proceed.`,
          ),
        );
        process.exit(1);
      }

      console.info(
        green(`  ✓   Release tag already exists: "${italic(tagName)}"`),
      );
    } else if (this.git.createTag(tagName, releaseNotes)) {
      console.info(green(`  ✓   Created release tag: "${italic(tagName)}"`));
    } else {
      console.error(red(`  ✘   Could not create the "${tagName}" tag.`));
      console.error(
        red(
          `      Please make sure there is no existing tag with the same name.`,
        ),
      );
      process.exit(1);
    }
  }

  /** Pushes the release tag to the remote repository. */
  private _pushReleaseTag(tagName: string): void {
    const remoteTagSha = this.git.getRemoteCommitSha(tagName);
    const expectedSha = this.git.getLocalCommitSha('HEAD');

    // The remote tag SHA is empty if the tag does not exist in the remote repository.
    if (remoteTagSha) {
      if (remoteTagSha !== expectedSha) {
        console.error(
          red(
            `  ✘   Tag "${tagName}" already exists on the remote, but does not ` +
              `refer to the version bump commit.`,
          ),
        );
        console.error(
          red(
            `      Please delete the tag on the remote if you want to proceed.`,
          ),
        );
        process.exit(1);
      }

      console.info(
        green(
          `  ✓   Release tag already exists remotely: "${italic(tagName)}"`,
        ),
      );
      return;
    }

    if (!this.git.pushBranchOrTagToRemote(tagName)) {
      console.error(red(`  ✘   Could not push the "${tagName}" tag upstream.`));
      console.error(
        red(
          `      Please make sure you have permission to push to the ` +
            `"${this.git.remoteGitUrl}" remote.`,
        ),
      );
      process.exit(1);
    }

    console.info(green(`  ✓   Pushed release tag upstream.`));
  }

  /**
   * Checks the release output by running the release-output validations for each
   * release package.
   */
  private _checkReleaseOutput(
    releaseOutputDir: string,
    currentVersion: Version,
  ) {
    let hasFailed = false;

    if (!checkReleasePackage(releaseOutputDir, currentVersion)) {
      hasFailed = true;
    }

    // In case any release validation did not pass, abort the publishing because
    // the issues need to be resolved before publishing.
    if (hasFailed) {
      console.error(
        red(
          `  ✘   Release output does not pass all release validations. ` +
            `Please fix all failures or reach out to the team.`,
        ),
      );
      process.exit(1);
    }

    console.info(green(`  ✓   Release output passed validation checks.`));
  }
}

/** Entry-point for the create release script. */
if (require.main === module) {
  new PublishReleaseTask(
    join(__dirname, '../../'),
    'barista',
    'components',
  ).run();
}

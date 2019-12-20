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

import * as ts from 'typescript';

import { DtMigrationRule, DtTargetVersion } from '../migration-rule';
import { createStringLiteral } from '../../utils';

const MODULE_SPECIFIERS = new Map<string, string>([
  ['@dynatrace/dt-iconpack', '@dynatrace/barista-icons'],
  ['@dynatrace/angular-components', '@dynatrace/barista-components'],
]);

/**
 * A migration rule that updates imports from the previous old dt-iconpack to the
 * new barista icons.
 */
export class LegacyImportsRule extends DtMigrationRule {
  /** The printer instance that creates the new import declarations */
  printer = ts.createPrinter();

  /** Whether this rule should be enabled - update version matches 5 */
  ruleEnabled = this.dtTargetVersion === DtTargetVersion.V5;

  /** AST-node visitor */
  visitNode(declaration: ts.Node): void {
    // Only look at import declarations.
    if (
      !ts.isImportDeclaration(declaration) ||
      !ts.isStringLiteralLike(declaration.moduleSpecifier)
    ) {
      return;
    }

    const moduleSpecifier = declaration.moduleSpecifier;
    const importLocation = moduleSpecifier.text;

    // If the import module is not one of the legacy import locations, skip check.
    if (![...MODULE_SPECIFIERS.keys()].includes(importLocation)) {
      return;
    }

    // Whether the existing import declaration is using a single quote module specifier.
    const singleQuoteImport = moduleSpecifier.getText()[0] === `'`;
    const newImportSpecifier = this.printer.printNode(
      ts.EmitHint.Unspecified,
      createStringLiteral(
        MODULE_SPECIFIERS.get(importLocation)!,
        singleQuoteImport,
      ),
      declaration.getSourceFile(),
    );

    const recorder = this.getUpdateRecorder(
      moduleSpecifier.getSourceFile().fileName,
    );

    recorder.remove(moduleSpecifier.getStart(), moduleSpecifier.getWidth());
    recorder.insertRight(moduleSpecifier.getStart(), newImportSpecifier);
  }
}

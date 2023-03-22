// @ts-check
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import chalk from "chalk";
import { getPageEntryFiles } from "./get-page-entry-files.mjs";
import { getPageExternalDeps } from "./get-page-external-deps.mjs";
import { getPageSourceFiles } from "./get-page-source-files.mjs";

/** @param {string} [buildDir] */
function getBuildDir(buildDir) {
  return buildDir || join(process.cwd(), ".pages");
}

/** @param {string} path */
function pathToImport(path) {
  return path.replace(/\.[tj](sx?)$/, ".j$1");
}

/**
 * @param {string} buildDir
 * @param {import("./types.js").Page[]} pages
 */
function writeFiles(buildDir, pages) {
  const entryFiles = pages.flatMap((page) =>
    getPageEntryFiles(page.sourceContext)
  );

  /** @type {Record<string, string>} */
  let deps = {};

  for (const file of entryFiles) {
    const fileDeps = getPageExternalDeps(file);
    deps = { ...deps, ...fileDeps };
  }

  const depsFile = join(buildDir, "deps.ts");

  const depsContents = `export default {\n${Object.keys(deps)
    .map((key) => `  "${key}": () => import("${key}") as unknown`)
    .join(",\n")}\n};\n`;

  writeFileSync(depsFile, depsContents);

  const examples = [...new Set(entryFiles.flatMap(getPageSourceFiles))];
  const examplesFile = join(buildDir, "examples.js");

  const examplesContents = `import { lazy } from "react";\n\nexport default {\n${examples
    .map((path) => `  "${path}": lazy(() => import("${pathToImport(path)}"))`)
    .join(",\n")}\n};\n`;

  writeFileSync(examplesFile, examplesContents);
}

class PagesWebpackPlugin {
  /**
   * @param {object} options
   * @param {string} options.buildDir The directory where the build files should
   * be placed.
   * @param {import("./types.js").Page[]} options.pages
   */
  constructor(options) {
    this.buildDir = getBuildDir(options.buildDir);
    this.pages = options.pages;

    writeFiles(this.buildDir, this.pages);
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    const pages = this.pages;

    // Find the CSS rule and exclude the pages from it so we can handle the CSS
    // ourselves.
    const rule = compiler.options.module.rules.find(
      (rule) => typeof rule === "object" && typeof rule.oneOf === "object"
    );

    const cssRules =
      typeof rule === "object" &&
      rule.oneOf?.filter(
        (rule) => rule.test && /\.css/.test(rule.test.toString())
      );

    if (cssRules) {
      const excludes = pages.map((page) => page.sourceContext);
      cssRules.forEach((cssRule) => {
        cssRule.exclude = Array.isArray(cssRule.exclude)
          ? [...cssRule.exclude, ...excludes]
          : excludes;
      });

      compiler.options.module.rules.push({
        include: pages.map((page) => page.sourceContext),
        test: /\.css$/,
        loader: "null-loader",
      });
    }

    compiler.hooks.make.tap("PagesWebpackPlugin", (compilation) => {
      if (!compiler.watchMode) return;
      for (const page of pages) {
        compilation.contextDependencies.add(page.sourceContext);
        getPageEntryFiles(page.sourceContext).forEach((file) => {
          compilation.fileDependencies.add(file);
          compilation.contextDependencies.add(dirname(file));
        });
      }
    });

    compiler.hooks.watchRun.tap("PagesWebpackPlugin", (compiler) => {
      const { modifiedFiles, removedFiles } = compiler;
      if (!modifiedFiles) return;
      if (!removedFiles) return;

      /** @param {string} file */
      const log = (file, removed = false) => {
        console.log(
          `${
            removed ? chalk.red("Removed page") : chalk.yellow("Updated page")
          }: ${file}`
        );
      };

      for (const file of removedFiles) {
        log(file, true);
        return writeFiles(this.buildDir, pages);
      }

      if (modifiedFiles.size === 1) {
        const page = pages.find((page) =>
          modifiedFiles.has(page.sourceContext)
        );
        if (page) {
          log(page.sourceContext);
          return writeFiles(this.buildDir, pages);
        }
      }

      for (const file of modifiedFiles) {
        if (pages.some((page) => file === page.sourceContext)) continue;
        if (!pages.some((page) => file.includes(page.sourceContext))) continue;
        log(file);
        return writeFiles(this.buildDir, pages);
      }
    });
  }
}

export default PagesWebpackPlugin;

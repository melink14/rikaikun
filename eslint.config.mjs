import { fixupConfigRules, fixupPluginRules, fixupConfigRules } from "@eslint/compat";
import _import from "eslint-plugin-import";
import tsdoc from "eslint-plugin-tsdoc";
import sortImportsEs6Autofix from "eslint-plugin-sort-imports-es6-autofix";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/dist"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:json/recommended-with-comments",
    "plugin:import/recommended",
    "plugin:lit/recommended",
    "plugin:promise/recommended",
    "plugin:mocha/recommended",
    "prettier",
)), {
    plugins: {
        import: fixupPluginRules(_import),
        tsdoc,
        "sort-imports-es6-autofix": sortImportsEs6Autofix,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.webextensions,
        },
    },

    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },
    },

    rules: {
        "import/no-unresolved": ["error", {
            ignore: ["csv-parse/sync"],
        }],

        "block-scoped-var": "error",
        eqeqeq: "error",
        "no-var": "error",
        "prefer-const": "error",
        "eol-last": "error",
        "no-trailing-spaces": "error",

        quotes: ["warn", "single", {
            avoidEscape: true,
        }],

        "linebreak-style": ["error", "unix"],
        "no-tabs": "error",
        "sort-imports-es6-autofix/sort-imports-es6": "error",
        "unicode-bom": "error",
        "promise/prefer-await-to-then": "error",
        curly: "error",
        "mocha/prefer-arrow-callback": "error",
    },
}, ...fixupConfigRules(compat.extends(
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
)).map(config => ({
    ...config,
    files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    settings: {
        "import/resolver": {
            typescript: {},
        },
    },

    rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/restrict-plus-operands": "off",
        "import/no-named-as-default-member": "off",
        "@typescript-eslint/no-non-null-assertion": "off",

        "@typescript-eslint/no-empty-function": ["error", {
            allow: ["private-constructors"],
        }],

        "tsdoc/syntax": "error",
    },
}, ...compat.extends("plugin:node/recommended").map(config => ({
    ...config,

    files: [
        "**/web-test-runner.config.js",
        "utils/*",
        "**/snowpack.config.cjs",
        "**/commitlint.config.cjs",
        "**/.prettierrc.cjs",
    ],
})), {
    files: [
        "**/web-test-runner.config.js",
        "utils/*",
        "**/snowpack.config.cjs",
        "**/commitlint.config.cjs",
        "**/.prettierrc.cjs",
    ],

    languageOptions: {
        globals: {
            ...globals.node,
        },
    },

    settings: {
        "import/resolver": {
            node: {
                extensions: [".js", ".cjs", ".ts"],
            },
        },
    },

    rules: {
        "node/no-unpublished-import": "off",
    },
}];
import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
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

export default defineConfig([globalIgnores(["dist/*", "node_modules/*"]), {
    extends: fixupConfigRules(compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
    )),

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        react: fixupPluginRules(react),
        "react-hooks": fixupPluginRules(reactHooks),
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.jest,
            page: true,
            browser: true,
            context: true,
            jestPuppeteer: true,
            BASE_URL: true,
        },

        parser: tsParser,
        ecmaVersion: 6,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                modules: true,
            },
        },
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        eqeqeq: "error",

        "@typescript-eslint/consistent-type-assertions": ["error", {
            assertionStyle: "never",
        }],

        "@typescript-eslint/no-empty-function": ["error", {
            allow: ["arrowFunctions"],
        }],

        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "error",
        "no-unused-vars": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
        }],

        "no-use-before-define": "off",

        "@typescript-eslint/no-use-before-define": ["error", {
            functions: false,
        }],

        "@typescript-eslint/no-var-requires": "off",

        "prefer-const": ["error", {
            destructuring: "all",
        }],

        "react/no-array-index-key": "error",
        "react/prop-types": "off",
        "arrow-parens": ["error", "always"],

        "no-unneeded-ternary": ["error", {
            defaultAssignment: true,
        }],

        "quote-props": ["error", "as-needed"],
    },
}, {
    files: ["**/*.ts", "**/*.tsx"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "error",
    },
}]);
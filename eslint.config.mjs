import {FlatCompat} from '@eslint/eslintrc';
const compat=new FlatCompat({baseDirectory:process.cwd()});
const config=[...compat.extends('next/core-web-vitals','next/typescript'),{ignores:['.next/**','node_modules/**']}];
export default config;

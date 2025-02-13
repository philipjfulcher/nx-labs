# @nrwl/deno

## Setup

Create a new Nx worksapce if you don't already have one.

```shell
npx create-nx-workspace@latest --preset=apps
```

`cd` into the new workspace you created.

Install the Deno plugin

```shell
npm i -DE @nrwl/deno@latest
```

## Create a new Deno App

```shell
npx nx g @nrwl/deno:app
```

You can run `npx nx serve <your-Deno-app-name>` and see the sample web server on htts://localhost:8000
You can also run test, lint, and build as tasks for `<your-Deno-app-name>`

```shell
npx nx serve <your-Deno-app-name>
npx nx test <your-Deno-app-name>
npx nx lint <your-Deno-app-name>
npx nx build <your-Deno-app-name>
```

Building/Bundling is an optional step in Deno so you don't have to build when using @nrwl/deno, but it can be useful to bundle the code into a single file for easier portability if you so need it.

## Create a new Deno Library

```shell
npx nx g @nrwl/deno:app
```

Deno libraies only come with lint/test targets to run.

```shell
npx nx test <your-Deno-library-name>
npx nx lint <your-Deno-library-name>
```

You can easily consume these libraries with their import aliases that are listed in the `import_map.json` in the root of the workspace.

## Customizing

The executors have a `denoConfig` option that allows you to pass in a deno config. This defaults to the generated `deno.json` in the project root of each generated deno project.
Within this file you can control various aspects of Deno, such as lint and test settings.
[Read more about the `deno.json` config file](https://deno.land/manual/getting_started/configuration_file)

By default this config uses the `import_map.json` in the root of the workspace.
This file contains the import alias to your other local Deno projects that you can use across other projects.

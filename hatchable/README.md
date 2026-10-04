# EGregoRA — Hatchable deployment bundle

A pre-built, Hatchable-ready copy of the EGregoRA website.

Hatchable runs **no build step** and rejects `scripts.build` in `package.json`, so this folder
contains the *already compiled* Eleventy output under `public/` and no package.json at all.

```
hatchable.toml      project manifest (name, tagline, description, tags)
public/             the whole site — served at the project root
  index.html        Introduction
  podcast/          Podcast + feed.xml
  videos/  ask-ed/  infographics/  music/  products/  research/
  404.html  robots.txt  assets/
```

## Deploy

1. Zip this folder (or use the prepared `egregora-hatchable.zip` in the repo root).
2. hatchable.com → console → **Import** → upload the zip (zip root *or* one top-level folder both work).
3. The validator should pass cleanly — static assets only, no API routes, no migrations, no secrets.
4. The project starts **private**; click **Publish** when you want `egregora.hatchable.site` on the open web.

Alternative: Import by GitHub URL only works if the imported repo root looks like this folder,
so either point it at a repo whose root *is* this bundle, or use the zip.

## Rebuilding after a content change

From the repository root:

```bash
npm run build          # Eleventy → _site/
rm -rf hatchable/public && mkdir -p hatchable/public && cp -r _site/* hatchable/public/
npm run zip:hatchable  # → egregora-hatchable.zip
```

## Automated deploy (MCP)

From the repository root, with network access to hatchable.com:

```bash
export HATCHABLE_TOKEN=hb_…            # console → Settings → API keys
npm run deploy:hatchable               # rebuild bundle + create project + deploy
```

Useful flags:

```bash
node scripts/hatchable-deploy.mjs --tools              # print the live tool surface
node scripts/hatchable-deploy.mjs --dry-run            # validate, ship nothing
node scripts/hatchable-deploy.mjs --project proj_xxx   # redeploy an existing project
node scripts/hatchable-deploy.mjs --name "EGregoRA" --slug egregora
```

The script speaks the Streamable HTTP MCP transport, probes each tool's own schema for its
argument names, sends text files through `write_files` in batches of 20, pushes the six product
JPEGs through `upload_file` as base64, runs `dry_run_deploy` and refuses to ship if the validator
reports blockers. The token is read from the environment and never written to disk.

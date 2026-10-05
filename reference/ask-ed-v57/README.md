# Reference snapshot — the Ask Ed page as it stood at v57

Taken 5 October 2026, immediately before the fox's muzzle-fur fix.

This is a known-good state: the page with the familiar and his ask box side by
side above the conversation, the gated image and video studio, the gate-word on
the letter form, and the fox exactly as he was — including the orange muzzle fur
protruding through the black of his nose, which is the fault the next commit
sets out to correct.

## What is here

| File        | Lives at                   |
|-------------|----------------------------|
| ask-ed.njk  | `src/ask-ed.njk`           |
| fox.js      | `src/assets/js/fox.js`     |
| site.js     | `src/assets/js/site.js`    |
| main.css    | `src/assets/css/main.css`  |

## Reverting

Everything:

    cp reference/ask-ed-v57/ask-ed.njk src/ask-ed.njk
    cp reference/ask-ed-v57/fox.js     src/assets/js/fox.js
    cp reference/ask-ed-v57/site.js    src/assets/js/site.js
    cp reference/ask-ed-v57/main.css   src/assets/css/main.css
    npm run build:hatchable

Just the fox:

    cp reference/ask-ed-v57/fox.js src/assets/js/fox.js && npm run build:hatchable

Then commit and push to `arena/01a10807-egregora` as usual; CI redeploys.

## Also tagged in git

    git show ask-ed-v57:src/assets/js/fox.js   # read it without checking out
    git checkout ask-ed-v57 -- src/assets/js/fox.js

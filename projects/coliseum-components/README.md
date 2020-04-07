TODO:

-   Extract GameConfService and update taverntierlevelicon and cardCost in card.component.ts
-   Same for hero.component
-   CardTooltip, quest.component: how to handle events?

rm -rf dist/coliseum-components/ && ng build coliseum-components && 'cp' -rf dist/coliseum-components/ /g/Source/zerotoheroes/firestone/core/node_modules/\@firestone-hs/

rm -rf dist/coliseum-components/ && ng build coliseum-components && npm publish dist/coliseum-components --access public

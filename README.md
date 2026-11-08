# Thunder Dragon

Besegra draken! Strid mot monster och samla rubiner för att låsa upp vägen till åskdraken på bergets top!


## Story

Thunder dragon bor längst upp på Mount Thunder. Han har stulna emeralder på ryggen som ger honom extra krafter. Du som spelare måste hitta rubiner som som kan omvandlas till rustning och vapen som kan motstå kraften från emeralderna.

## Gameplay

Spelet börjar med en startskärm där spelaren namnger sin hjälte. Namnet visas i spelet och sparas. Finns ett sparat spel kan man fortsätta där man slutade, eller börja ett nytt spel med en ny hjälte (då skrivs det sparade spelet över).

Spelaren börjar i byn vid Mount Thunders fot, därifrån ger han sig ut till 4a platser för att samla rubiner, dessa är skogen, sjön, byn, grottan i berget. På varje plats ska spelare besegra ett monster för att få en rubin.

### Skogen
Skogen är en tät blandskog med en tjock dimma. I skogen springer varulven runt med rubinen på bröstet. I skogen måste spelaren hitta en yxa, sedan måste de fånga varulvens svans och slå av rubinen på bröstet för att stoppa den.

Skogen består av fyra platser som hänger ihop i en ring: Skogsstigen (vid byn), Granskogen, Gläntan och Bäcken. Yxan (fastkilad i en stubbe) och varulven hamnar på slumpvisa platser i början av varje spel, aldrig på samma plats. Står man bredvid varulvens plats hör man tunga steg.

- Allt görs med musen. När spelaren har yxan blir muspekaren en yxa.
- Varulven springer runt och stannar ibland för att vädra. Klickar man på kroppen viker den undan, man måste fånga svansen.
- Fångar man svansen utan yxa sliter varulven sig loss.
- Med yxan börjar ett minispel: varulven vrider sig och rubinen åker fram och tillbaka. Spelaren ska träffa rubinen tre gånger innan greppet om svansen tar slut. Varje miss kostar grepp, och varje träff gör att varulven vrider sig snabbare. Efter varje slag tar det en liten stund innan yxan kan svingas igen, så det går inte att bara klicka snabbt.
- Tar greppet slut sliter varulven sig loss och springer till en annan av skogens platser.
- När rubinen slås loss är varulven besegrad och spelaren får skogens rubin.

## Sjön

Sjön är stor och spegelblank, i bakgrunden syns byn och berget.
I sjön simmar en jättebläckfisk som har rubinen i pannan. Spelaren måste ta fiskespöt och harpunen vid sjökanten, ro ut med båten och fiska efter bläckfisken. När spelaren fått napp ska de försöka få loss rubinen med harpunen.

Sjön består av två platser: Sjön (stranden, österut från byn) och Ute på sjön.

- På stranden står fiskespöt lutat mot den röda sjöboden och harpunen ligger på bryggan. Båten går bara att ro ut med när spelaren har båda.
- På sjöbodens vägg sitter en lapp från en gammal fiskare. Klickar man på den läser man hur man fångar bläckfisken.
- Ute på sjön syns bläckfiskens skugga glida under ytan. Spelaren klickar på vattnet för att kasta ut flötet. Landar det nära skuggan simmar bläckfisken dit och nafsar några gånger, sedan kommer nappet och flötet dras under.
- Vid nappet måste spelaren klicka direkt för att dra till. Klickar man medan den nafsar skräms den iväg, och väntar man för länge sliter den av betet.
- Sedan börjar ett minispel: bläckfisken stiger upp ur vattnet och dyker då och då. Spelaren kastar harpunen och ska träffa rubinen i pannan tre gånger innan linan brister. Är rubinen under vattnet blir det plask. Varje miss sliter på linan, och varje träff gör att bläckfisken rör sig och dyker snabbare. Efter varje kast tar det en liten stund innan harpunen kan kastas igen, så det går inte att bara klicka snabbt.
- Brister linan dyker bläckfisken undan och spelaren får fiska upp den igen.
- När rubinen lossnar är bläckfisken besegrad och spelaren får sjöns rubin.

## Grottan

Grottan ligger vid bergets fot, strax ovanför byn. Där inne bland de mörka gångarna bor en jättespindel som har rubinen i sitt nät. Spelaren måste ta facklan i början av grottan och navigera sig fram till spindelns näste, och där lura till sig rubinen genom att klara spindelns mattefrågor.

Grottan består av sju platser: Grottans mynning, Vägskälet, Droppstensgrottan, Avgrunden, Benhålan, Spindelgången och Spindelnästet. Vägen är alltid densamma: från Vägskälet går den högra gången till Benhålan, därifrån den vänstra gången till Spindelgången och sedan vidare in till nästet. Avgrunden är en återvändsgränd, och Droppstensgrottan leder runt till Benhålan.

- Vid mynningen sitter en fackla i en järnhållare på väggen. Utan facklan går det inte att gå in i mörkret.
- Alla gångar innanför mynningen är kolsvarta. Facklan lyser upp en cirkel runt muspekaren, så spelaren måste lysa runt för att hitta öppningarna till nästa gång. Ledtrådar i texten (prasslande, spindelväv, röda ögon) visar vägen.
- I nästet hänger spindeln i ett stort nät med rubinen invirad i silke bredvid sig. Klickar man på spindeln börjar ett minispel.
- Spindeln ställer räknegåtor (plus, minus och till sist gånger), och spelaren väljer rätt svar bland fyra. Inget tal i frågan eller svaret är större än 100, och frågorna blir svårare för varje rätt svar.
- Varje rätt svar får spindeln att trassla in sig när hon räknar på benen, och en av trådarna runt rubinen går av. Fem rätta svar och rubinen faller ner till spelaren.
- Fel svar visar det rätta svaret och kostar spindelns tålamod. Efter tre fel klättrar spindeln upp i taket och spelaren får börja om.
- När rubinen är vunnen hänger nätet tomt och spelaren har grottans rubin.

### Tech stack

Plain html, javascript and css. Runs in the browser and progress is saved to local storage.

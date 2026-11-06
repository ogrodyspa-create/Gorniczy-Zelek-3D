# Strefa piłkarska ZAGŁĘBIE LUBIN — V2

Zmiany dotyczą istniejącego świata Soccer i dekoracji portalu. Jest to szkolna strefa inspirowana klubowymi barwami i nazwą; nie użyto herbu, sponsorów ani oznaczeń oficjalnej współpracy.

## Zachowane mechanizmy

Nie zmieniono solvera Żelka, fizyki piłki i bramkarza, zasad punktowania, kolizji boiska, wejściowej rampy, parametrów ruchu ani kamery. Portal pozostaje w tych samych współrzędnych, otwiera to samo menu i wykorzystuje istniejące przejścia z rozgrzewaniem shaderów. Zmieniła się wyłącznie etykieta celu Soccer na „ZAGŁĘBIE LUBIN”. Główna pracownia i jej wyposażenie nie zostały przebudowane. Serce i znak szkoły są zachowane.

## Oprawa

- Trzy kolory sektorów: pomarańczowy/miedziany, zielony, biały; istniejące profilowane krzesełka, dachy i kolizje pozostają.
- 19 band z czytelnym słownym oznaczeniem klubu, dodatkowe oznaczenia wejścia i fasad.
- Zachowane cztery mapy PBR murawy, nieco mocniejsze pasy koszenia i białe linie bez nakładania dodatkowych płaszczyzn na trawę.
- Zachowane przestrzenne bramki i siatki. Tablica nadal wyświetla zdobyte gole; dodano etykietę „TWOJE GOLE”.
- Dwa reflektory SpotLight przy istniejących masztach. Uzupełniają HDRI i istniejący system cieni; nie dodają drogich map cieni.
- Portal posiada trzy subtelnie emitujące łuki oraz dwustronny napis. Dekoracje mieszczą się w jego dotychczasowym obrysie i nie zmieniają otworu ani kolizji.

## Opcjonalna opaska

Przycisk „Opaska kibica” jest dostępny tylko w świecie piłkarskim. Opaska w trzech kolorach odczytuje istniejący układ wiązań głowy i nie zapisuje do siatki fizycznej. Lookup kotwic jest odtwarzany w przestrzeni spoczynkowej, ponieważ Soccer powstaje dopiero wtedy, gdy Żelek stoi już przy portalu. Opaska nie zakrywa tułowia ani serca; przy czaku może być zasłonięta przez nakrycie głowy. Można zdjąć czako dotychczasowym przyciskiem, bez zmiany mechaniki wyposażenia.

## Zasoby i wydajność

Napisy są lokalnymi CanvasTexture z krojem systemowym, bez pobierania herbów i płatnych zasobów. Testy Node korzystają z minimalnej tekstury zastępczej wyłącznie do sprawdzania geometrii bez DOM; rzeczywisty tekst oceniamy w przeglądarce. Bandy współdzielą geometrię i materiał. Stałe części stadionu nadal są scalane według materiału. Tekstury oznaczeń są zwalniane przy usuwaniu świata i portali.

## Weryfikacja

Testy `verify-destination-menu`, `verify-portal-collision`, `verify-soccer-collision`, `verify-soccer-lighting`, `verify-soccer`, `verify-world-travel`: 6/6 zaliczonych. Obejmują naliczanie goli/restart, bramkarza, bieg po boisku, kolizje, powrót do Home, zachowanie wyposażenia i ponowne użycie świata.
Dodatkowy `verify-zaglebie` sprawdza trzy kolory sektorów, 19 band, reflektory, zmianę wyniku i opaskę na już przemieszczonym Żelku bez zmiany jego pozycji fizycznych.

## Zmienione pliki

- src/worlds/soccer/branding.ts — nowa identyfikacja i dekoracje portalu.
- src/worlds/soccer/supporter-band.ts — nowa opcjonalna opaska.
- src/worlds/soccer/stadium.ts — paleta, sektory, oznaczenia, sprzątanie tekstur.
- src/worlds/soccer/turf.ts — kolory linii i pasy murawy.
- src/worlds/soccer/facility.ts — podłączenie opaski do istniejącego cyklu świata.
- src/worlds/travel.ts — dodanie dekoracji do portali i komunikat ładowania, bez zmiany logiki podróży.
- src/worlds/destination-menu.ts — nazwa celu Soccer.
- scripts/verify-world-travel.mjs, scripts/verify-destination-menu.mjs — oczekiwana nowa etykieta celu.
- scripts/verify-zaglebie.mjs — nowy test regresji oprawy i dodatku.
- docs/zaglebie-lubin.md, docs/soccer-world.md — dokumentacja.

Podgląd V2: http://127.0.0.1:5182/. Z pracowni podejdź do portalu, naciśnij E i wybierz ZAGŁĘBIE LUBIN. W portalu powrotnym wybierz Home.

## Kontrola końcowa

Sześć testów regresji świata i dodatkowy test oprawy zakończyły się powodzeniem. TypeScript, ESLint i produkcyjny build przeszły; Vite zgłasza ostrzeżenie o dużym pakiecie Three.js. W podglądzie sprawdzono wejście przez portal, przejście na murawę, ruch i skok. Punktowanie i fizykę kontaktów potwierdzają testy automatyczne. Opaskę dopasowano do zmierzonego promienia głowy 25 mm. Pierwsza kompilacja materiałów WebGPU jest długa; nie przeprowadzono pomiaru FPS.

Porównanie źródeł z V1 potwierdziło zmiany tylko w siedmiu wskazanych plikach src. SHA256 archiwum V1 pozostaje: 25A6100EB22BAB05109186838033E07ACE0F459C5CD5B3623283D775ED99570A.

Końcowa kontrola przeglądarkowa potwierdziła również pełny powrót portalem do pracowni i ponowne wejście na stadion. Poprawiona opaska jest widoczna na głowie; po powrocie do szkoły znika wraz z przyciskiem. Zrzut rzeczywistego stadionu: zaglebie-stadion.png.

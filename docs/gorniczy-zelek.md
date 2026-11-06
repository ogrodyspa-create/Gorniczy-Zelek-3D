> Historyczny raport pierwszego etapu. Aktualna przebudowa i ograniczenia: [mining-workshop.md](mining-workshop.md).

# Górniczy Żelek — pierwsza implementacja etapu B

Baza: kod z dostarczonego ZIP-a. Zachowano LICENSE, README autora, solver XPBD/WASM, siatkę postaci, mimikę, wejście, optykę i wyposażenie oryginału.

Nowe moduły:
- `src/graphics/character/copper-heart.ts`: zamknięty relief przestrzenny próbkowany z dostarczonego PNG, miedziany materiał, niewielka emisja i pulsowanie. Pozycja jest próbkowana z deformującej się skóry z ujemnym odsunięciem 5 mm. Obiekt nie wywiera sił na solver. Luminancja PNG jest przybliżeniem głębokości, nie rekonstrukcją rzeczywistego modelu znaku. Szczotkowanie i niezależna bezwładność wymagają dalszego opracowania.
- `src/graphics/scene/mining-display.ts`: dekoracyjna tablica i trzy próbki minerałów za obszarem zabawy. Nie dodaje kolizji ani nowego interaktywnego warsztatu.

Paleta w jelly-flavors.ts zachowuje oryginalny zielony i dodaje miedź, biel oraz rubin. Przeciwnik w istniejącej scenie piłkarskiej korzysta teraz z kryształowej bieli. Zmiany absorpcji trafiają jednocześnie do materiału i istniejącego systemu kaustyki.

Logo: public/school-emblem.png pochodzi od użytkowniczki. Nie zastąpiono symboliki przypadkowymi narzędziami. Licencja kodu GPL-3.0 pozostaje bez zmian; uprawnienia do dystrybucji szkolnego znaku należy traktować oddzielnie od licencji kodu.

To etap B, nie ukończony projekt. Czako, pióropusz, kask, spawarka, dron i kopalnia nie zostały jeszcze dodane. Film nie jest używany w tej partii.

Materiały do dalszej pracy: najlepiej płaskie logo SVG/PDF (dla wiernego modelu z ostrymi konturami), zdjęcia zatwierdzonego czaka z kilku stron, emblemat perlik/żelazko i referencje szkolnej pracowni.

Uruchomienie na standardowym Node.js: npm ci, następnie npm run dev. W tym środowisku Node.js dostarcza Codex, a lokalne npm znajduje się dwa katalogi wyżej w package/bin/npm-cli.js. Dostępny jest także skrypt Uruchom-podglad.ps1 w katalogu głównym zadania.

Weryfikacja bazy: lint i TypeScript przeszły; build produkcyjny przeszedł. Pełny zestaw uruchomiono bezpośrednio przez node --test, ponieważ npm test wywołuje zsh. Wynik 38/39; verify-orientation.mjs wymaga kompilacji przez zsh/clang i zatrzymuje się na braku zsh. Nie jest to pozytywny wynik tego testu. Pozostałe testy obejmują fizykę, deformacje, rzuty, skoki, mimikę, huśtawkę, trampolinę, łóżko, kolizje i podróże między światami.

Podgląd oryginału został potwierdzony wizualnie w przeglądarce wbudowanej. Pierwsza kompilacja WebGPU była bardzo długa na tym komputerze. Nie wykonano pomiaru FPS ani odbioru jakości premium.

Sprawdzenie etapu B: lint, TypeScript i build produkcyjny przeszły. Potwierdzono rzeczywisty render, przełączenie miedź/biel, przeciągnięcie i puszczenie postaci oraz reset w przeglądarce. Znak jest widoczny, ale jego szczegóły są zbyt rozmyte przez refrakcję; nie spełnia jeszcze docelowego kryterium czytelności. Tablica znajduje się w tle i z początkowej pozycji kamery jest częściowo poza kadrem. Te ograniczenia wymagają kolejnej iteracji, nie są uznane za zakończone kryteria jakości.

Zmodyfikowane istniejące pliki: index.html, src/main.ts, src/style.css, src/app/flavor-picker.ts, src/app/runtime.ts, src/graphics/character/jelly-flavors.ts, src/worlds/soccer/facility.ts, src/worlds/soccer/lighting.ts.
Nowe pliki aplikacji: public/school-emblem.png, src/graphics/character/copper-heart.ts, src/graphics/scene/mining-display.ts, docs/gorniczy-zelek.md.
Pliki pomocnicze: baseline-tests.log, stage-b-tests.log, changed-files.txt; w katalogu zadania Uruchom-podglad.ps1 oraz podglad-etap-b.png. node_modules, dist i lokalny pakiet npm są plikami wygenerowanymi/narzędziowymi.

Porównanie SHA-256 z archiwum potwierdziło brak zmian w src/physics, geometrii źródłowej postaci, mimice i oryginalnych skryptach testowych. Nie wykonano commita.

Instalacja odtworzyła 111 pakietów z package-lock.json. npm zgłosił 13 podatności zależności (10 moderate, 3 high); w tej partii nie wykonano automatycznej aktualizacji zmieniającej bazę. Przed publicznym wdrożeniem potrzebny jest przegląd zależności.

Końcowy wynik pełnej regresji po etapie B: 38/39 testów zaliczonych. Jedyny niezaliczony test to ten sam verify-orientation.mjs co w bazie: brak zsh uniemożliwia kompilację wariantu testowego WASM. Nie pojawiły się nowe niezaliczone testy. Lint, TypeScript i build produkcyjny zaliczone oddzielnie.

# Audyt publikacji V2 na GitHub Pages

Data: 6 listopada 2026. Status: technicznie możliwe, jeszcze niegotowe do publikacji. Niczego nie wdrożono, nie utworzono repozytorium ani workflow, nie zmieniono kodu aplikacji, V1 ani ZIP-a. Rozwój pozostaje lokalnie w V2.

## Wyniki lokalne

Wykonano odpowiednik produkcyjnego skryptu: `node scripts/ensure-built-assets.mjs`, lokalny `tsc`, następnie `vite build --base=/gorniczy-zelek-v2/ --outDir audit-pages-dist`. Użyto Node 24.22.1 i istniejących zależności z node_modules; nie jest to jeszcze test czystego `npm ci` na GitHub Actions.

Build Vite 8.2.2: PASS, 126 modułów, 23 pliki, 47 074 800 bajtów (47,1 MB / 44,9 MiB). Jedyny komunikat builda: ostrzeżenie o pakiecie JS powyżej 500 kB (Three.js około 900 kB przed gzip). TypeScript przeszedł. Artefakt testowy jest osobnym katalogiem V2, nie zastąpił lokalnego dist. Nie należy dodawać audit-pages-dist do repozytorium źródłowego.

Kontrola statyczna HTML i JS/CSS znalazła 16 odwołań z prefiksem repozytorium; wszystkie mają odpowiadające pliki. To kontrola paczki, nie test pobrania przez publiczne HTTPS, MIME, cache ani renderowania builda na urządzeniach.

## Blokery i przygotowanie

1. **Ścieżka serca — blokujące.** `src/graphics/character/copper-heart.ts:8` ładuje `/school-emblem.png`. Dla adresu `https://KONTO.github.io/gorniczy-zelek-v2/` szukałaby pliku w korzeniu konta, nie repozytorium. Potwierdzono tę ścieżkę w wynikowym runtime. Start czeka na `createCopperHeart`, więc błąd może uniemożliwić uruchomienie. Przed publikacją zastosować `import.meta.env.BASE_URL + 'school-emblem.png'`. Nie wprowadzono poprawki w ramach audytu.
2. **Ustalenie base.** Obecny vite.config.js nie określa base (domyślnie `/`). Budowanie projektu Pages wymaga `--base=/NAZWA-REPO/` lub równoważnej konfiguracji. Dla własnej domeny / witryny głównej konta base może wynosić `/`. Własna domena nie jest potrzebna.
3. **Informacje o projekcie.** index.html ma oryginalne og:url, og:image, opisy i tytuły społecznościowe Jelly Baby. README prowadzi do oryginalnej gry. Zastąpić informacje o bieżącej aplikacji, zachowując uznanie autorstwa oryginału i licencję. Obecny odsyłacz GPL do oryginału nie zastępuje linku do źródeł zmodyfikowanej V2.
4. **Prawa do zasobów.** Uzupełnić rejestr opisany poniżej przed udostępnieniem publicznym.
5. **Odbiór sprzętowy.** Nie ma jeszcze udokumentowanych pomiarów startu/FPS/pamięci na komputerach szkolnych, Androidzie i iPhonie. Dotychczasowe lokalne ładowanie shaderów było długie.

## Zasoby i HTTPS

| Grupa | Ustalenie |
| --- | --- |
| Żelek | jelly-baby.bin około 10,1 MB emitowany przez Vite; mały manifest JSON wbudowany jako data URL. |
| Drewno | Mapy przez new URL(..., import.meta.url); desktopowa albedo 14,1 MB, mobilna 1,95 MB. Odpowiedni preload wybierany przez pointer coarse/fine. |
| Murawa | Cztery lokalne mapy PBR, około 5,7 MB, dołączane do świata Soccer. |
| Środowisko | Dwa lokalne pliki rgba16f po 4,19 MB. Oba przygotowywane przy starcie. |
| Modele dodatkowe | Czako, kask, spawarka, stadion i bandy powstają proceduralnie; napisy CanvasTexture używają fontu systemowego. |
| WebAssembly | Kernel osadzony jako base64 w JS, tworzony przez WebAssembly.Module/Instance. Brak osobnego pobierania .wasm; brak wymogu jego MIME. Źródło C i skrypty kompilacji są w scripts/native i scripts. |
| Worker | transport.worker emitowany jako lokalny plik JS przez new URL i Vite. Brak użycia SharedArrayBuffer/crossOriginIsolated w kodzie src; aktualny wariant nie potrzebuje COOP/COEP do pamięci współdzielonej. |
| Dźwięk | Synteza Web Audio; nie znaleziono sieciowego pobierania plików dźwiękowych w src/app. Aktywacja po pierwszej interakcji, zgodna z ograniczeniami autoplay. Referencyjne WAV-y nie trafiają do dist. |
| Logo/serce | Plik public/school-emblem.png jest w paczce, ale odwołanie runtime wymaga poprawki base. Favicon /logo.png w HTML został prawidłowo przepisany przez Vite. |

Nie stwierdzono wymogu backendu, płatnego API, bazy danych ani zewnętrznego CDN dla działania gry. Linki CDN/fontów w refs służą referencjom, nie produkcyjnej stronie. Publikować tylko artefakt dist, nie katalog projektu, node_modules, referencyjne filmy czy archiwa. HTTPS Pages zapewnia secure context; wszystkie zasoby należy utrzymać pod tym samym HTTPS. Po zatwierdzeniu publikacji sprawdzić statusy i MIME wszystkich żądań oraz brak mixed content w sieci przeglądarki.

## Urządzenia

Renderer celowo wymaga WebGPU i secure context, wyłącza WebGL fallback. WebAssembly ma odrębny fallback obliczeniowy JS — nie zastępuje WebGPU. Instalacja programu nie będzie potrzebna, lecz odpowiednia przeglądarka, sprzęt i sterownik tak.

- Komputery: priorytet odbioru to aktualny Chrome/Edge na Windows i Chrome/Safari na Macu. Obsługa WebGPU zależy również od GPU, sterownika, akceleracji i polityk szkolnych. Firefox ma wsparcie WebGPU na Windows od 141; inne platformy wymagają osobnego potwierdzenia, nie należy ich automatycznie obiecywać.
- Android: Chrome wdrożył WebGPU od 121 na Androidzie 12+ z wybranymi GPU Qualcomm/ARM. Nie oznacza to zgodności każdego telefonu. Potrzebny test aktualnej przeglądarki na konkretnych urządzeniach.
- iPhone/iPad: WebKit dodał WebGPU w Safari 26. Starszych wersji bez WebGPU nie obsłużymy w obecnej architekturze. Sprawdzić realny telefon i tablet, temperaturę, pamięć, dotyk i audio.
- Przeglądarki wewnątrz komunikatorów: brak gwarancji; zalecić otwarcie linku w pełnej przeglądarce.

Duże tekstury po rozpakowaniu zajmują znacznie więcej pamięci GPU niż na dysku. 47 MB to cały artefakt, nie zmierzony transfer pojedynczej sesji. Cache i lazy loading zmieniają transfer, a instalacja HTTPS nie skraca automatycznie kompilacji shaderów. Testy odbioru: zimny/ciepły start, główna scena, rozciąganie, akcesoria, portal i powrót, piłka, dotyk, audio, zmiana orientacji, kilka minut gry, błędy GPU, FPS i pamięć.

## Koszty

GitHub Free pozwala na Pages z publicznego repozytorium. Domyślny adres github.io i HTTPS wystarczą; własna domena jest opcjonalna i może kosztować. Statyczna gra szkolna nie wymaga płatnego hostingu. Limit opublikowanej witryny to 1 GB, miękki limit transferu 100 GB/miesiąc; obecna paczka jest znacznie mniejsza. Dla skali: pobranie całych 47 MB bez cache około 2000 razy to około 94 GB — nie jest to prognoza liczby użytkowników. Przy dużym ruchu kontrolować limity. Planować standardowy publiczny runner Actions, nie płatne większe runnery.

## Licencja i pochodzenie

README i LICENSE deklarują GPL-3.0-only projektu Jelly Baby / Scott Sun. Udostępnienie minifikowanego JS i WASM użytkownikom jest dystrybucją; należy zapewnić odpowiednie źródła tej samej zmodyfikowanej wersji, zachować informacje licencyjne i autorstwo, opisać modyfikacje z datami. Najprostszy wariant: publiczne repo V2, LICENSE, jasny odsyłacz „Kod źródłowy i licencje” w aplikacji, tag źródeł odpowiadający każdemu wydaniu. Dołączyć źródło C kernela i skrypty budowy, model źródłowy i wymagane wejścia generowania, konfigurację i lockfile. Nie wystarczy sam link do oryginalnego repo. Sprawdzić odtwarzalność: compile-kernel.mjs korzysta z zsh/clang/wasm-ld; zwykły build korzysta z gotowego osadzonego kernela, ale instrukcja odbudowy musi uwzględnić ten toolchain.

| Zasób | Dowód / działanie przed publikacją |
| --- | --- |
| Kod i model Jelly Baby | Dostarczony oryginalny ZIP, LICENSE GPL-3.0-only, README autora; zachować informacje i źródła generowania. |
| Drewno, trawa, HDR EXR, obrazy oryginału | docs/assets-and-verification.md określa je jako authored, ale brak osobnego rejestru autorów, adresów źródłowych i licencji poszczególnych obrazów. Nie dowodzi to naruszenia, jednak audyt nie potwierdza kompletu praw; uzyskać potwierdzenie od źródła albo udokumentowaną licencję. |
| Znak szkoły i relief serca | Grafika przekazana przez użytkowniczkę; potwierdzić uprawnienie do publicznego wykorzystania/przetworzenia i warunki dystrybucji w repo. Nie przypisywać automatycznie GPL samemu znakowi/znakowi towarowemu. |
| Czako, kask, spawarka, pracownia | Proceduralny kod V2; dokumentacja odnotowuje film trzy.mp4 jako referencję, bez zakupionych modeli. Nie publikować samego filmu bez praw; odnotować źródło referencji i zakres wykorzystania. |
| Stadion Zagłębia | Proceduralna oprawa, napis i kolory; nie użyto oficjalnego herbu ani deklaracji współpracy. Zachować informację o nieoficjalnej strefie. |
| Biblioteki | Zainstalowane three 0.185.0: MIT; delaunator 5.1.0: ISC; robust-predicates 3.0.3: Unlicense. Zachować wymagane teksty i przygotować THIRD_PARTY_NOTICES z kompletnego lockfile. |
| Referencje WAV/JPEG/HTML | Nie są automatycznie potrzebne w publicznym dist. Przed publikacją źródeł rozdzielić niezbędne wejścia odbudowy od zbędnych referencji i ustalić licencje; nie usuwać wymaganych źródeł tylko w celu pominięcia problemu praw. |

## Plan publikacji i aktualizacji — dopiero po zatwierdzeniu

1. W V2 poprawić base serca, metadane i informacje o źródłach. Uzupełnić rejestr licencji. Nie zmieniać solvera ani V1.
2. Przeprowadzić czysty npm ci, npm run lint, npm run typecheck, npm run build z właściwym base oraz regresje. Node 24 LTS / wersja zgodna z lockfile. Zapewnić komplet generowanych wejść i skryptów odbudowy.
3. Sprawdzić lokalny build pod prefiksem repozytorium, na rzeczywistych urządzeniach. Wyeliminować 404 i błędy GPU. Udokumentować czas startu i płynność. Nie uznawać samego zielonego builda za test gry.
4. Przedstawić gotowy pakiet, listę plików do upublicznienia, licencje, nazwę repo i proponowany adres do zatwierdzenia. Nie wysyłać wcześniej źródeł do publicznego repo.
5. Po zgodzie utworzyć osobne repo wyłącznie dla zawartości V2. Nigdy nie publikować nadrzędnego folderu zawierającego V1, ZIP i source. Wykluczyć node_modules, logi, pliki lokalne, audytowy build i zbędne referencje.
6. Skonfigurować Pages przez Actions: checkout, setup-node, npm ci, testy, build z base, upload-pages-artifact wyłącznie dist, deploy-pages. Uprawnienia ograniczyć do contents:read, pages:write i id-token:write tam, gdzie potrzebne. Pierwsze publikacje uruchamiać ręcznie (workflow_dispatch), nie automatycznie po każdej zmianie.
7. Po wdrożeniu włączyć/weryfikować HTTPS, wykonać testy publicznego adresu i dopiero przekazać link uczniom. Sprawdzić pobranie tekstur, worker, WASM, dźwięk po kliknięciu i powrót portalem.
8. Aktualizacje: lokalny rozwój V2 → testy → przegląd różnic → zatwierdzone wydanie → ręczny deploy. Zachować stały URL, tag źródeł i changelog. Poprzedni tag/artefakt umożliwia rollback bez dotykania V1. Haszowane pliki Vite ułatwiają cache; nie ma potrzeby instalowania aplikacji u użytkowników.

## Źródła zewnętrzne

- Vite: https://vite.dev/guide/static-deploy
- GitHub Pages, limity i dostępność: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- HTTPS: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- WebGPU: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- Android: https://developer.chrome.com/blog/new-in-webgpu-121
- Safari: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- Firefox: https://mozillagfx.wordpress.com/2025/07/15/shipping-webgpu-on-windows-in-firefox-141/
- GPLv3: https://www.gnu.org/licenses/gpl-3.0.en.html
- FAQ źródeł: https://www.gnu.org/licenses/gpl-faq.en.html

Końcowy ESLint również zakończył się kodem 0. Nowe pliki tego audytu: dokument docs/audyt-github-pages.md oraz lokalny katalog testowego builda audit-pages-dist/ (23 pliki). Brak zmian wykonawczego kodu aplikacji.

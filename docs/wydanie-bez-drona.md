# Stabilny punkt kontrolny — 6 listopada 2026

Repozytorium: https://github.com/ogrodyspa-create/Gorniczy-Zelek-3D

- stable-bez-drona: zamrożony zapis obecnej V2.
- v1.0.0-bez-drona: tag tego samego commita; nie przesuwać i nie nadpisywać.
- develop-dron: początkowo ten sam commit, wyłączne miejsce dalszego rozwoju.
- main: pozostaje bez zmian. Brak automatycznego scalania develop do stable.

Przygotowanie wydania nie dodaje drona. Zachowuje szkołę, akcesoria, serce i portal Zagłębia. Jedyna korekta renderowania dotyczy adresu grafiki serca: BASE_URL zamiast absolutnego korzenia domeny; geometria i fizyka pozostają identyczne. Dodano informacje o źródłach/licencjach i polecenie build:pages.

## Uruchamianie i budowanie

Node 24, npm ci, npm run dev. Zwykłe npm run build zachowuje base `/`; npm run build:pages buduje dla `/Gorniczy-Zelek-3D/`. Wymagane HTTPS lub localhost, WebGPU i obsługujący je sprzęt/sterownik. Brak fallbacku WebGL. Kernel WASM jest osadzony w JS; dźwięk jest proceduralny i uruchamia się po interakcji. Odbudowa kernela ze źródła C wymaga zsh, clang i wasm-ld — patrz docs/assets-and-verification.md.

## Pages jeszcze nieaktywne

docs/pages-stable.yml.example jest nieaktywnym szablonem, nie workflow. Nie utworzono witryny ani nie uruchomiono deploy. Szablon pobiera wyłącznie stable-bez-drona i weryfikuje zgodność z tagiem; develop-dron nie może zostać wybrany jako źródło.

Przed aktywacją: zatwierdzenie właścicielki, potwierdzenie praw do grafik według ASSET-SOURCES.md, test czystej instalacji oraz odbiór Chrome/Edge, Android i Safari/iOS z WebGPU. Zweryfikować czasy startu, FPS, pamięć, dotyk, audio, rozciąganie i powrót portalem. Wcześniejszy audyt docs/audyt-github-pages.md jest historyczny; wskazany tam błąd adresu serca został poprawiony w tym wydaniu.

workflow_dispatch wymaga obecności workflow na domyślnej gałęzi. Ponieważ main nie wolno teraz zmieniać, aktywacja szablonu na main wymaga osobnej zgody i przeglądu. Przed aktywacją sprawdzić aktualne wersje akcji, najlepiej przypiąć je do zweryfikowanych SHA, ustawić Pages na GitHub Actions i zatwierdzanie środowiska github-pages (jeżeli dostępne). Dopiero potem ręcznie uruchomić publikację. Nie zmieniać domyślnej gałęzi jako obejścia.

## Aktualizacje

Dalszy kod lokalnie na develop-dron, testy i przegląd zmian. Żadnych pushy do stable-bez-drona ani tagu v1.0.0-bez-drona. Następne zaakceptowane wydanie otrzymuje nowy tag i odrębną gałąź stabilną; zmiana źródła publikacji jest jawna i zatwierdzana. Można przywrócić publikację starego tagu, bez cofania rozwoju i bez dotykania archiwum V1. Ochrona gałęzi/tagów po stronie serwera wymaga osobnego skonfigurowania reguł; sama nazwa gałęzi nie jest blokadą zapisu.

## Weryfikacja punktu kontrolnego

2026-11-06: npm run build:pages, lint i typecheck zakończone kodem 0. Sześć testów (destination-menu, portal-collision, soccer-collision, soccer, world-travel, zaglebie) przeszło, zero błędów. Statyczna kontrola 17 adresów zasobów w buildzie: bez braków, prawidłowy prefiks grafiki serca. Licencja i notices kopiowane do public i dist. Ostrzeżenie Vite dotyczy dużego pakietu Three.js. Nie wykonano jeszcze testu czystego npm ci w CI ani publicznego HTTPS i urządzeń mobilnych. Metadane społecznościowe index.html pozostają do dostosowania przed publikacją.


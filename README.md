# GÓRNICZY ŻELEK 3D — V2 bez drona

Interaktywna aplikacja oparta na **Jelly Baby — Scott Sun**, zachowująca oryginalną fizykę i rozwijająca pracownię górniczą oraz strefę piłkarską.

Kod: https://github.com/ogrodyspa-create/Gorniczy-Zelek-3D

- Stabilny punkt kontrolny: `stable-bez-drona`, tag `v1.0.0-bez-drona`.
- Dalszy rozwój: `develop-dron`. Nie przesuwać stabilnego tagu ani gałęzi.
- Publikacja Pages pozostaje wyłączona w ramach tego wydania; szablon jest nieaktywny.

## Uruchamianie

Node 24, `npm ci`, `npm run dev`. Produkcja: `npm run build`. Przygotowanie ścieżek GitHub Pages: `npm run build:pages`. Kontrole: `npm run lint`, `npm run typecheck`.

Wymagane HTTPS lub localhost, JavaScript oraz WebGPU na obsługiwanym sprzęcie. Brak fallbacku WebGL. Dźwięk uruchamia się po interakcji. Obsługa dotyku nie oznacza gwarantowanej wydajności każdego telefonu.

## Źródła i licencja

Projekt pochodny objęty **GPL-3.0-only**; pełny tekst w [LICENSE](LICENSE). Zachowano uznanie autorstwa Scott Sun i [oryginalny README](docs/README-upstream.md). Repozytorium zawiera źródła TypeScript/JavaScript, C kernela WASM, skrypty generowania i wymagane zasoby. Instrukcje odbudowy: [assets-and-verification](docs/assets-and-verification.md).

Modyfikacje V2 (2026-11-06): pracownia, akcesoria górnicze, miedziane serce, identyfikacja szkoły, strefa Zagłębia i przygotowanie adresów Pages. Nie zmieniono oryginalnego solvera na potrzeby tego wydania. Brak oficjalnej współpracy z klubem i brak oficjalnego herbu.

[Rejestr zasobów](ASSET-SOURCES.md), [licencje bibliotek](THIRD_PARTY_NOTICES.md), [publikacja i rozwój](docs/wydanie-bez-drona.md). Znak szkoły i inne grafiki nie otrzymują automatycznie nowej licencji wskutek dołączenia do repozytorium; ustalenia i braki dowodowe opisano w rejestrze.

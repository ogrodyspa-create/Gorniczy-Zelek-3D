# Górniczy Żelek — przebudowa pracowni (etap 2)

## Referencja i modele

Przeanalizowano klatki 0–3 s filmu użytkowniczki `trzy.mp4`. Czako ma cylindryczny czarny korpus bez ronda, złoty otok, asymetryczne narzędzia (perlik oraz ostro zakończone żelazko) w liściastym wieńcu. Model jest autorską geometrią proceduralną odtworzoną na podstawie ujęcia z przodu, nie skanem ani zakupionym modelem. Nie pobierano zewnętrznych modeli ani tekstur.

Biały pióropusz zawiera 60 zakrzywionych stosin i przestrzenne, zwężające się promienie piór oraz zamknięte, zakrzywione chorągiewki o soczewkowym przekroju. Geometria jest scalona w 10 ruchomych wiązek, 232560 trójkątów. Nie zawiera kart alfa, płaszczyzn ani stożków udających pióra. Wiązki reagują łagodnie na prędkość przemieszczenia głowy. Mikrostruktura jest przybliżeniem; dokładne odwzorowanie tyłu i boków wymaga dodatkowych ujęć czaka.

Kask zawiera kopułę, rant, żebra, obudowę lampy, soczewkę, metalowy pierścień i przewód. SpotLight obraca się razem z głową; jego cel ma współrzędne lokalne, więc plama światła podąża za nakryciem. Wyłączenie lampy lub zdjęcie kasku wyłącza reflektor. Dodano także przyłbicę spawalniczą jako trzeci element istniejącego systemu wyposażenia.

## Zachowanie postaci

Nie zmieniono plików solvera, siatki postaci ani parametrów mechaniki. Istniejące pięć wiązań głowy, odrywanie nakrycia podczas skoku, zdejmowanie przy wejściu do łóżka i przenoszenie między światami pozostają aktywne. Panel wyposażenia korzysta z tych samych obiektów i mocowania co interakcja przy stole. Nie wymusza zmiany pozycji ani sił Żelka. Podczas chwytania zmiana wyposażenia jest blokowana.

Serce i oryginalny PNG szkoły zachowano. Ujemne odsunięcie od skóry zmniejszono z 5 mm do 1,6 mm; pozostała ta sama geometria, materiał i pulsowanie. Ekstremalne odkształcenia mogą nadal wymagać dopracowania czytelności i osadzenia sztywnego reliefu.

## Pracownia

Nowy moduł `src/worlds/main/mining/workshop.ts` zastępuje wcześniejszą małą ekspozycję. Ceglana ściana ma geometrię instancjonowaną, stalowe słupy, miedziane instalacje i duży szyld. Dodano gabloty z minerałami, emitujące listwy i punktowe światła, boczne pasy przemysłowej posadzki oraz stanowisko spawalnicze. Oryginalna podłoga nadal obsługuje kaustykę i cienie; ma nową skalę drewna i ciemniejsze wykończenie. Huśtawka, trampolina, łóżko oraz portal otrzymały spójną paletę stali, miedzi i ciemnej zieleni. Portal zachowuje przejścia do istniejących scen dodatkowych.

Ściany, stół akcesoriów i stanowisko mają kolizje przez istniejący FacilityCollision. Drobne dekoracyjne elementy nie otrzymują osobnych kosztownych colliderów. Nowa pracownia jest własnością świata home i znika po przejściu do innych światów.

## Spawanie

Cykl trwa 8 sekund i można go wcześniej zatrzymać. Sterowanie: panel lub E przy stanowisku. Łuk emituje biało-niebieskie światło, a rozżarzenie metalu wygasa po zakończeniu. Pula obejmuje 300 smug 3D, emitowanych z prędkością 260/s; cząstki mają różne prędkości, kierunki i czas życia, opadają i gasną. Bufory są współdzielone i aktualizowane bez tworzenia obiektów cząstek w pętli. Nie dodano dymu.

## Podgląd i nagranie

Domyślnie Żelek ma czako. Panel umożliwia zmianę nakrycia, jego zdjęcie, włączenie lampy oraz spawania. Lokalny przycisk „Nagraj pokaz · 12 s” zapisuje rzeczywisty obraz canvas jako WebM, bez wysyłania go na serwer. Podczas nagrania można chodzić, skakać i przeciągać postać. Po nagraniu pojawia się link „Zapisz nagranie”.

Nowe wnętrze pozwala na niższy kąt kamery; zrezygnowano z dawnego ograniczenia widoku wyłącznie do nieskończonego blatu. Limit bufora 4 mln pikseli został zachowany. Początkowa macierz kamery jest jawnie aktualizowana po ustawieniu OrbitControls, aby pierwsze wskazanie było zgodne z jej rzeczywistą pozycją.

## Zakres dalszej pracy

Nie ma jeszcze szybu, kopalni ani drona — zgodnie z zakresem następnego etapu. Pozostaje ocena jakości na docelowym komputerze, dokładniejsze materiały mikropowierzchni i dopasowanie pióropusza do dodatkowych ujęć referencyjnych. Nie jest to deklaracja zakończenia jakości premium ani modelu muzealnego 1:1.

## Weryfikacja

Lint, TypeScript i produkcyjny build uruchamiane po zmianach. Testy fizyki, huśtawki, trampoliny, oświetlenia, rozgrzewania shaderów, nakryć głowy i nowej pracowni zaliczone. Test deformacji początkowo wykrył niesynchronizowaną macierz kamery po zmianie limitu kąta; po poprawce przeszedł wszystkie przypadki, w tym wielopunktowe chwytanie i solver JavaScript. Raporty: stage2-regression.log (pierwsza seria, 7/8), stage2-deformation.log (zaliczona poprawka), stage2-mining-final.log (nowe modele i efekty). Pełnego zestawu pozostałych światów nie powtarzano; wcześniejszy test kompilacji orientacji nadal wymaga zsh/clang.

# Wirtualna Półka i Przełącznik Widoków w ShelfMedia

Wzbogacenie aplikacji ShelfMedia o widok Wirtualnej Półki z pionowymi, kolorowymi grzbietami pozycji ułożonymi na nowoczesnych metalowych regałach z podświetleniem LED, połączony z dotychczasowym widokiem tabeli za pomocą przełącznika widoków.

> [!IMPORTANT]
> **Podsumowanie zatwierdzonych wyborów projektowych:**
> - **Orientacja tekstu**: Tytuł dzieła umieszczony pionowo wzdłuż grzbietu (od góry do dołu), a u podstawy grzbietu wyróżniona ocena gwiazdkowa (np. `★9.8`) oraz subtelna miniatura typu/platformy.
> - **Gabaryty grzbietów**: Dynamiczne zróżnicowanie wysokości (od ~190px do ~260px) oraz grubości (od ~36px do ~68px) uzależnione od medium (Książki, Gry, Filmy, Seriale) oraz objętości (liczba stron / spędzone godziny).
> - **Stylistyka półki**: Nowoczesna, ciemna półka metalowa (grafit/stal szczotkowana) z subtelną linią neonowego podświetlenia LED krawędzi regału i realistycznym cieniem rzucanym przez stojące grzbiety.
> - **Interakcja**: Kliknięcie dowolnego grzbietu natychmiast wysuwa okno szczegółów z pełną specyfikacją dzieła, notatką, okładką oraz przyciskami „Edytuj” i „Usuń”.
> - **Synchronizacja całości**: Zarówno aplikacja webowa, jak i generator paczki ZIP (skrypt Python CustomTkinter, pliki HTML i skrypty startowe) zostaną zaktualizowane i skompilowane.

---

### 1. Overview & Core Concept

- **Co robi ta funkcja**: Pozwala użytkownikowi przełączać bibliotekę między analitycznym widokiem tabeli a wizualną „Wirtualną Półką” regałową. Na półkach stoją pionowe grzbiety dzieł o zróżnicowanych gabarytach i kolorystyce dedykowanej dla kategorii:
  - **Gra**: Odcienie fioletu / chłodnego błękitu (`#6366f1` / `#3b82f6`)
  - **Książka**: Ciepły brąz / terakota / pomarańcz (`#b45309` / `#ea580c`)
  - **Film**: Głęboki fiolet / magenta / amarant (`#a21caf` / `#ec4899`)
  - **Serial**: Szmaragdowa i leśna zieleń (`#059669` / `#10b981`)
  - **Inne/Własne typy**: Zrównoważona paleta akcentowa (np. cyjan, bursztyn).
- **Docelowy odbiorca**: Kolekcjonerzy gier, czytelnicy, kinomaniacy i serialomaniacy ceniący estetykę domowej biblioteczki połączoną z precyzyjną bazą danych.
- **Kluczowa wartość**: Natychmiastowe poczucie obcowania z fizyczną kolekcją na regale, zachowujące 100% możliwości filtrowania (lata ukończenia, wyszukiwarka, statusy, sortowanie).

---

### 2. User Experience & Visual Design

#### Kluczowe ścieżki użytkownika (User Flows)
1. **Przełączanie widoku**: Na górnym pasku biblioteki użytkownik widzi nowoczesny przełącznik segmentowy:
   `[ 📋 Tabela | 📚 Wirtualna Półka ]`. Wybór jest zapamiętywany w sesji/stanie.
2. **Przeglądanie regałów**:
   - Pozycje układają się na poziomych półkach metalowych.
   - Gdy grzbiety dochodzą do krawędzi kontenera, naturalnie zawijają się na kolejny poziom regału.
   - Filtry (wyszukiwarka tekstowa, rocznik ukończenia, typ dzieła, status) dynamicznie aktualizują stojące pozycje z płynną animacją.
3. **Inspekcja dzieła**:
   - Po najechaniu kursorem na grzbiet (`hover`): grzbiet delikatnie wysuwa się w górę o 12px, a jego podświetlenie LED zyskuje blask, ukazując zwięzły tooltip.
   - Kliknięcie grzbietu: otwiera estetyczny modal (odpowiednik `CTkToplevel` w Pythonie) z pełnymi danymi: pełny tytuł, okładka, platforma, czas/strony, status, data, ocena, recenzja oraz przyciski szybkiej akcji `Edytuj` i `Usuń`.
4. **Edycja / Usuwanie**:
   - Kliknięcie `Edytuj` w modalu otwiera formularz edycji dzieła.
   - Kliknięcie `Usuń` prosi o potwierdzenie i usuwa pozycję z półki bez przeładowania.

#### Paleta barw i motyw wizualny
- **Konstrukcja regału**: Ciemny stop tytanowo-stalowy (`#121824` / `#1e293b`), metaliczna krawędź górna z odbiciem światła (`#334155`), krawędziowa linia LED w chłodnym odcieniu paryskim (`#38bdf8` / `#66c0f4` z delikatnym rozmyciem `box-shadow: 0 4px 12px rgba(56,189,248,0.25)`).
- **Faktura grzbietu**: Pionowy gradient symulujący zaokrąglenie grzbietu książki lub pudełka gry z delikatnym cieniem wewnętrznym (`inset 2px 0 4px rgba(255,255,255,0.15), inset -2px 0 4px rgba(0,0,0,0.4)`).
- **Typografia**: Monospace i tabular figures dla ocen (`font-mono tracking-tight font-bold`), pionowy napis tytułu w czytelnym `font-sans font-semibold text-xs` z `writing-mode: vertical-rl` lub eleganckim obrotem.

---

### 3. Key Product Decisions & Trade-Offs

- **Decyzja 1: Zróżnicowane gabaryty grzbietów**
  - *Podejście*: Wysokość grzbietu bazuje na typie (np. Komiks/Książka wyższa ~240-260px, Gra ~210-230px, Film DVD/BD ~190-210px). Grubość grzbietu skaluje się zależnie od stron lub godzin (np. 100 stron = 36px, 800+ stron = 64px; 5h = 36px, 100+ h = 60px).
  - *Dlaczego*: Daje autentyczny, organiczny wygląd prawdziwego regału domowego, eliminując wrażenie sztucznego, szablonowego kafelkowania.
- **Decyzja 2: Pełna integracja z filtrami i rocznikami**
  - *Podejście*: Wirtualna Półka korzysta z dokładnie tego samego zoptymalizowanego strumienia `filteredItems` co tabela.
  - *Dlaczego*: Użytkownik może jednym kliknięciem zobaczyć „półkę z grami z 2025 roku” lub „półkę przeczytanych książek fantastycznych”.
- **Decyzja 3: Aktualizacja skryptu Python CustomTkinter i paczki ZIP**
  - *Podejście*: Rozbudowanie kodu Pythona w `src/utils/zipGenerator.ts` i `media_tracker.py` o obsługę widoku półki (`CTkCanvas` / `CTkFrame` z kolorowymi kafelkami grzbietów i oknem `CTkToplevel`) oraz aktualizacja samodzielnego pliku HTML w paczce.

---

### 4. Technical Architecture & Data Strategy

#### Architektura komponentów

```
┌─────────────────────────────────────────────────────────────┐
│                      LibraryTab.tsx                         │
├─────────────────────────────────────────────────────────────┤
│  Top Bar: Search Input · Type & Status Filters · Year Tabs  │
│  View Switcher: [ 📋 Tabela ]  [ 📚 Wirtualna Półka ]       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (viewMode === 'table')         (viewMode === 'shelf')
               ▼                              ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│         TableView           │ │       VirtualShelfView      │
│  (Istniejąca tabela danych, │ │  - Obliczanie poziomów      │
│   sortowanie kolumn,        │ │  - Metalowe półki z LED     │
│   zaznaczanie hurtowe)      │ │  - Grzbiety SpineItem       │
└─────────────────────────────┘ └──────────────┬──────────────┘
                                               │ (kliknięcie grzbietu)
                                               ▼
                                ┌─────────────────────────────┐
                                │     ItemDetailModal.tsx     │
                                │  - Pełne dane pozycji       │
                                │  - Okładka + ocena + czas   │
                                │  - Akcje: [Edytuj] [Usuń]   │
                                └─────────────────────────────┘
```

#### Aktualizacje plików w projekcie:
1. `src/components/LibraryTab.tsx`:
   - Dodanie stanu `viewMode: 'table' | 'shelf'`.
   - Renderowanie przełącznika segmentowego w pasku narzędzi.
   - Implementacja komponentu `VirtualShelfView` z układem regałów, dynamicznym wyliczaniem wysokości/grubości i kolorów grzbietów.
   - Integracja z oknem podglądu szczegółów i akcjami edycji/usuwania.
2. `src/components/ItemDetailModal.tsx` (lub modal szczegółów):
   - Estetyczne okno prezentujące okładkę, pełny opis, platformę, liczbę stron/godzin, ocenę i recenzję z przyciskami Edytuj / Usuń.
3. `src/utils/zipGenerator.ts`:
   - Zaktualizowanie skryptu Pythona (`media_tracker.py`) o przełącznik `CTkSegmentedButton` i widok regału z kolorowymi przyciskami grzbietów oraz oknem `CTkToplevel`.
   - Zaktualizowanie samodzielnego pliku `index.html` / `ShelfMedia.html` w paczce ZIP, aby offline'owa wersja również posiadała widok Wirtualnej Półki.

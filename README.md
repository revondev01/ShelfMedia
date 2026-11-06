# ShelfMedia — Twoja Półka na Media (Your Media Shelf)

![Version](https://img.shields.io/badge/version-2.8-66c0f4?style=for-the-badge)
![Privacy](https://img.shields.io/badge/100%25_Local-Offline_Database-a4d007?style=for-the-badge)
![Languages](https://img.shields.io/badge/Language-PL_%7C_EN-38bdf8?style=for-the-badge)
![Tech](https://img.shields.io/badge/React_19-TypeScript_%7C_Tailwind_CSS-1b2838?style=for-the-badge)

**ShelfMedia** to nowoczesna, działająca w 100% lokalnie aplikacja do katalogowania, oceniania, organizowania w kolekcje i podsumowywania dzieł kultury: **gier, książek, filmów, seriali, komiksów, mang, anime, planszówek, podcastów, audiobooków** oraz dowolnych własnych kategorii.

> *Twoja osobista kolekcja gier, książek, filmów i seriali. Zapis lokalny, podział rocznikowy i statystyki i generowanie grafik na sociale.*
>
> *Full English documentation and feature overview is available in the second half of this document.*

---

## Główne funkcje (PL)

### 1. Biblioteka, Kolumna „Twórca / Twórcy” & Zakładki Roczników
- **Czysty start z automatycznymi kolorami:** Baza danych (w tym listy typów mediów, platform/formatów i gatunków) jest na starcie całkowicie pusta. Podczas dodawania nowych pozycji, typów mediów lub platform aplikacja automatycznie przypisuje im losowe, estetyczne kolory z możliwością ich pełnej edycji.
- **Kolumna „Twórca / Twórcy”:** Dedykowane pole informujące o autorze książki, reżyserze filmu/serialu lub studiu deweloperskim gry — widoczne zaraz po kolumnie *Gatunek* w tabeli, formularzach, szczegółach dzieła, kolekcjach, podsumowaniach oraz w imporcie/eksporcie CSV i JSON.
- **Zakładki Roczników:** Szybkie przełączanie widoku biblioteki pomiędzy trybem **Rok ukończenia** a **Rok wyjścia dzieła** oraz czytelne filtrowanie po typie medium.
- **Masowa edycja i operacje grupowe:** Zaznaczanie wielu pozycji w tabeli, aby jednocześnie zmienić ich typ, platformę, gatunek, twórcę, status lub dodać je do wybranej kolekcji.

### 2. Wirtualna Półka ( w Bibliotece i Kolekcjach ) & Eksport Półek do `.PNG`
- **Spójne przełączanie widoków:** Zarówno w zakładce **Biblioteka**, jak i wewnątrz każdej **Kolekcji** dostępne są jednolite widoki **Tabela** oraz **Wirtualna Półka**.
- **Kolorowanie grzbietów i dynamiczna legenda:** Możliwość wyświetlania grzbietów na regale **Wg typu mediów** lub **Wg platformy / formatu**. Legenda (*Typ mediów:* z wektorowymi ikonami aplikacji lub *Platformy i Formaty:* z kolorami) dynamicznie dostosowuje się wyłącznie do aktualnie wyświetlanych pozycji na półce.
- **Personalizacja Półki i podświetlenie LED:** Regulacja pojemności półki (od 1 do 20 pozycji), wybór koloru deski regału, tła półki, podpórki (*Bookend*) oraz paska **LED** (ze statusem *Włączone* / *Wyłączone* i wyborem dowolnego koloru świecenia).
- **Eksport aktualnego widoku półek do `.PNG`:** Generowanie wysokiej jakości grafik `.png` przedstawiających aktualny widok wirtualnych półek z nagłówkiem **`Shelf • [Nazwa użytkownika]`** oraz dynamiczną legendą (*Typ mediów* z ikonami wektorowymi lub *Platformy i Formaty*) dopasowaną do zawartości grafiki. Przy większej liczbie półek aplikacja automatycznie dzieli eksport po maks. **5 półek na plik**, pobierając kolejne pliki z numeracją (`_1.png`, `_2.png`...).

### 3. Twoje Kolekcje & Serie
- *Twórz tematyczne zestawy z własną ikoną i kolorem, oglądaj je na wirtualnej półce i generuj grafiki na sociale.*
- **Pełna personalizacja kolekcji:** Wybór własnej ikony wektorowej, koloru symbolu, koloru tła odznaki oraz koloru akcentu.
- **Ręczne ustalanie kolejności i Wirtualna Półka:** Układanie pozycji w dowolnej kolejności (rankingi Top 10, serie wydawnicze, ulubione dzieła) w widoku **Tabela** lub przeglądanie ich na **Wirtualnej Półce**.
- **Generator grafik kolekcji na Social Media:** Eksport kolekcji do plików PNG w formatach **16:9**, **9:16** oraz **1:1** z automatycznym podziałem dużych kolekcji na części (`_1.png`, `_2.png`...).

### 4. Statystyki, Roczniki i Generator Podsumowań na Social Media
- **Zakładki statystyk wg roku:** Analiza dla trybów **Cała baza**, **Rok wyjścia dzieła** oraz **Rok ukończenia**, z rozbiciem na poszczególne miesiące.
- **Wektorowe ikony w podsumowaniach:** Wszystkie podsumowania, karty **Dzieła Roku / Miesiąca** (z obsługą miejsc *Ex aequo*), wykresy *Podziału czasu wg Platformy / Formatu* oraz *Najchętniej eksplorowanych Gatunków* wykorzystują spójne ikony wektorowe aplikacji.
- **Generator Grafik Podsumowań (Roczne Ukończone / Miesięczne):** Tworzenie gotowych grafik PNG w formatach **Poziomym (16:9)**, **Pionowym Story (9:16)** oraz **Kwadracie (1:1)** z własnymi gradientami tła i podpisem użytkownika.

### 5. Zarządzanie Listami Wyboru, Kolorami i Ikonami
- **Przycisk „Listy wyboru” (pasek górny):** Otwiera okno *Zarządzaj listami wyboru, kolorami i ikonami* (*Dostosuj nazwy, ikony i kolory dla typów mediów, platform i formatów oraz nazwy gatunków*) z trzema zakładkami: **Typy mediów, Kolory i Ikony**, **Platformy i Formaty** (z edycją koloru każdej platformy) oraz **Gatunki**.
- **Przycisk „Zmień kolory i ikony” (na Wirtualnej Półce):** Otwiera dedykowany widok *Zarządzaj kolorami i ikonami grzbietów* (*Dostosuj ikony i kolory dla tabeli i grzbietów półki*) skupiony na typach mediów oraz platformach i formatach.

### 6. Ustawienia, Kolory UI, Autosave i Kopie Zapasowe (`.JSON` / `.CSV`)
- **Automatyczny zapis (Autosave):** Każda zmiana jest natychmiast zapisywana w pamięci przeglądarki (`localStorage`) oraz — podczas pracy przez `URUCHOM_NA_LOCALHOST.bat` — automatycznie synchronizowana z plikiem `shelfmedia_db.json` na dysku.
- **Skala ocen (0.5–5.0 lub 0.5–10.0):** Przełącznik skali ocen automatycznie przeliczający wszystkie oceny w całej bazie danych.
- **Profil i Ikona Główna Aplikacji:** Ustawienie własnego pseudonimu do podsumowań oraz personalizacja głównej ikony ShelfMedia (kolor tła, symbol w środku i jego kolor).
- **Kolory UI:** 8 gotowych motywów kolorystycznych oraz dowolna personalizacja kolorów elementów interfejsu (z ochroną `color-scheme: dark` zapobiegającą odwracaniu koloru czarnego i białego przez przeglądarki).
- **Pełna Kopia Zapasowa (`.json`) i Arkusze (`.csv`):** Eksport i import 1:1 całego stanu aplikacji do pliku `.json` oraz poprawny eksport/import arkuszy `.csv` (obsługa kolumny `creator`, godzin oraz dokładnej liczby stron książek).

---

## Wymagania dla użytkownika (PL)

### 1. Wymagania podstawowe (Przeglądarka & Pamięć lokalna)
- **Przeglądarka internetowa (aktualna wersja):** Google Chrome / Chromium (90+), Microsoft Edge (90+), Mozilla Firefox (90+), Opera, Brave, Vivaldi lub Apple Safari (macOS / iOS 15+).
- **Włączona obsługa JavaScript oraz `localStorage`:** Aplikacja automatycznie zapisuje dane (Autosave) w pamięci lokalnej przeglądarki. *Uwaga:* Nie zaleca się pracy w trybie prywatnym / Incognito bez pobrania kopii zapasowej `.json` przed zamknięciem okna, ponieważ zamknięcie sesji Incognito czyści pamięć przeglądarki.
- **Połączenie z internetem:** **Niewymagane** w wersji Portable (`ShelfMedia_Localhost.zip`) — aplikacja działa w 100% offline.

### 2. Wymagania dla wersji Portable Localhost (`ShelfMedia_Localhost.zip`)
- **Windows 10 / 11 (`URUCHOM_NA_LOCALHOST.bat`):** **Brak dodatkowych wymagań.** Skrypt automatycznie wykrywa zainstalowanego Pythona, a w razie jego braku uruchamia wbudowany w każdy system Windows **PowerShell** (`server.ps1`). Nie trzeba instalować żadnych zewnętrznych programów ani baz danych.
- **Bezpośrednie uruchomienie (`index.html`):** Działa na każdym systemie operacyjnym (Windows, macOS, Linux, ChromeOS) po dwukrotnym kliknięciu pliku `index.html` (zapis w `localStorage` przeglądarki).
- **Opcjonalnie (macOS / Linux dla `server.py`):** Python 3 do uruchomienia lokalnego serwera z zapisem bezpośrednio do pliku `shelfmedia_db.json`.

### 3. Wymagania sprzętowe
- **Pamięć RAM i procesor:** Dowolny komputer, laptop, tablet lub smartfon umożliwiający płynne działanie przeglądarki (min. 2 GB RAM; do generowania grafik `.PNG` w jakości Retina 2x zalecane min. 4 GB RAM).
- **Miejsce na dysku:** Paczka `ShelfMedia_Localhost.zip` zajmuje **poniżej 5 MB**, a plik bazy danych (`.json` / `.csv`) dla kilku tysięcy pozycji zajmuje zaledwie od kilkudziesięciu KB do kilku MB.
- **Ekran:** Pełna responsywność od ekranów smartfonów (`360px`) po monitory Full HD / 4K (do pełnego widoku tabeli i Wirtualnej Półki najwygodniejsza rozdzielczość to min. `1024px` szerokości).

---

## Jak uruchomić? (PL)

### Opcja A: Wersja Portable (Windows / Localhost — bez instalacji Node.js)
1. Pobierz paczkę **`ShelfMedia_Localhost.zip`** i wypakuj ją do dowolnego folderu.
2. Kliknij dwukrotnie plik:
   - **`URUCHOM_NA_LOCALHOST.bat`** — uruchamia szybki lokalny serwer w tle na porcie `8765` (`http://127.0.0.1:8765`), otwiera aplikację w domyślnej przeglądarce i automatycznie zapisuje dane w pliku `shelfmedia_db.json`.

### Opcja B: Uruchomienie z kodu źródłowego (Dla programistów)
Wymagane środowisko [Node.js](https://nodejs.org/) (wersja 18+):

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom serwer deweloperski (port 3000)
npm run dev

# 3. Zbuduj wersję produkcyjną i zaktualizuj zasoby Portable ZIP
npm run build
```

---
---

## English Overview — ShelfMedia (v2.8)

**ShelfMedia** is a 100% local, privacy-first media tracker, virtual bookshelf, and collection manager for **games, books, movies, TV series, comics, manga, anime, board games, podcasts, audiobooks**, and any custom media categories.

> *Your personal collection of games, books, movies, and series. Local storage, yearly breakdown, statistics, and social graphics generation.*

### Key Features (EN)

#### 1. Library, "Creator(s)" Column & Year Tabs
- **Clean Start with Auto-Assigned Colors:** The database (including media types, platforms/formats, and genres) starts completely empty. As you add items, media types, or platforms, random vibrant colors are automatically assigned and can be customized at any time.
- **"Creator(s)" Column (`Twórca / Twórcy`):** Track the author, director, studio, or developer right next to the *Genre* column across the table, forms, item details, collections, statistics, and CSV/JSON backups.
- **Year Tabs:** Filter your library by **Completion Year** or **Release Year** along with clean text-based media type filters.
- **Bulk Actions:** Select multiple items to batch-edit their media type, platform, genre, creator, status, or add them to a collection at once.

#### 2. Virtual Shelf (in Library & Collections) & `.PNG` Shelf Export
- **Unified View Switcher:** Both the **Library** tab and every **Collection** feature identical **Table** and **Virtual Shelf** views.
- **Spine Color Modes & Dynamic Legend:** Color shelf spines **By Media Type** or **By Platform / Format**. The shelf legend (*Media Type:* with vector app icons or *Platforms & Formats:* with color badges) dynamically adapts strictly to the items currently displayed on the shelf.
- **Shelf Personalization & LED Underglow:** Customize shelf capacity (1–20 items per shelf), plank color, shelf background, bookend color, and **LED** lighting (*Enabled* / *Disabled* status with custom LED glow color).
- **Export Shelves to `.PNG`:** Export the current virtual shelf view to `.png` with a **`Shelf • [Username]`** header and a dynamic vector-icon/color legend matching the displayed shelves. If your view exceeds 5 shelves, ShelfMedia automatically generates sequential `.png` files (`_1.png`, `_2.png`...) with up to 5 shelves per image.

#### 3. Curated Collections & Series
- *Create themed sets with custom icons and colors, view them on the virtual shelf, and generate social graphics.*
- **Custom Collection Branding:** Pick a vector icon, icon color, badge background color, and accent color for every collection (e.g., *"Top Horrors"*, *"Favorite Games Ever"*, *"Top Fantasy Books"*).
- **Table & Virtual Shelf Views:** Reorder items in the **Table** view or inspect them on the **Virtual Shelf**, and export collection graphics for social media in **16:9**, **9:16**, or **1:1** aspect ratios.

#### 4. Statistics, Yearly Replays & Social Summary Graphics
- **Stats Year Tabs:** Switch between **Entire DB**, **Release Year**, and **Completion Year**, with monthly breakdowns.
- **Vector Icons Across All Summaries:** Top-rated **Works of the Year / Month** (including full support for tied *Ex aequo* winners), *Time Breakdown by Platform / Format*, *Most Explored Genres*, and generated social cards use crisp vector icons instead of emojis.
- **Social Summary Card Generator:** Export **Annual (Completed)** and **Monthly** summary graphics in **Landscape (16:9)**, **Story (9:16)**, and **Square (1:1)** formats with custom background gradients.

#### 5. Managing Selection Lists, Spine Colors & Icons
- **"Options" (`Listy wyboru` in top bar):** Opens *Manage Selection Lists, Colors & Icons* (*Customize names, icons, and colors for media types, platforms and formats, and genre names*) with tabs for **Media Types, Colors & Icons**, **Platforms & Formats**, and **Genres**.
- **"Customize colors & icons" (`Zmień kolory i ikony` on Virtual Shelf):** Opens *Manage Spine Colors & Icons* (*Customize icons and colors for table badges and shelf spines*) focused on media types and platforms/formats.

#### 6. Settings, UI Theme, Autosave & Backups (`.JSON` / `.CSV`)
- **Automatic Local Save (Autosave):** Every change is saved automatically in browser `localStorage` and synced to `shelfmedia_db.json` when running via `URUCHOM_NA_LOCALHOST.bat`.
- **Rating Scale (`0.5–5.0` or `0.5–10.0`):** Seamlessly convert all ratings across the entire database.
- **Profile, Main App Icon & UI Theme:** Set your nickname for summaries, customize the main ShelfMedia icon, and pick from 8 curated color themes or custom HEX element colors (with `color-scheme: dark` preventing browser auto-dark-mode from inverting black and white).
- **Full `.JSON` Backup & `.CSV` Spreadsheets:** 1:1 full system backup in `.json` and accurate `.csv` import/export (including `creator`, hours spent, and exact book page counts).

### System & User Requirements (EN)

#### 1. Browser & Storage Requirements
- **Modern Web Browser:** Google Chrome / Chromium (90+), Microsoft Edge (90+), Mozilla Firefox (90+), Opera, Brave, Vivaldi, or Apple Safari (macOS / iOS 15+).
- **JavaScript & `localStorage` Enabled:** All changes are saved automatically (Autosave) in browser `localStorage`. *Note:* Avoid using Private / Incognito mode without exporting a `.json` backup before closing the window, as closing an Incognito session clears browser storage.
- **Internet Connection:** **Not required** for the Portable ZIP edition (`ShelfMedia_Localhost.zip`) — works 100% offline.

#### 2. Portable Localhost Requirements (`ShelfMedia_Localhost.zip`)
- **Windows 10 / 11 (`URUCHOM_NA_LOCALHOST.bat`):** **Zero additional dependencies.** The launcher automatically detects Python if installed, or falls back to built-in Windows **PowerShell** (`server.ps1`). No Node.js or external database installation is required.
- **Direct File Launch (`index.html`):** Works on any OS (Windows, macOS, Linux, ChromeOS) by double-clicking `index.html` (stores data in browser `localStorage`).
- **Optional (macOS / Linux for `server.py`):** Python 3 to run the local background server syncing directly to `shelfmedia_db.json`.

#### 3. Hardware Requirements
- **RAM & CPU:** Any desktop, laptop, tablet, or smartphone capable of running a modern browser (min. 2 GB RAM; 4 GB+ RAM recommended when generating high-resolution 2x Retina `.PNG` graphics).
- **Disk Space:** The `ShelfMedia_Localhost.zip` package takes **under 5 MB**, and a database of thousands of items (`.json` / `.csv`) uses only a few hundred KB to a few MB.
- **Display:** Fully responsive from `360px` mobile screens up to Full HD / 4K monitors (`1024px+` width recommended for the widest Table and Virtual Shelf experience).

---

## Licencja / License
Projekt udostępniany na licencji **Apache-2.0 / MIT**. Zaprojektowano dla graczy, czytelników i kinomanów i nie tylko! / Designed for gamers, readers, movie buffs, and more!

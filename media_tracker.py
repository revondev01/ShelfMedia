"""
=============================================================================
             MEDIA & GAME TRACKER (STEAM STYLE DESKTOP APP)
=============================================================================
Kompletna aplikacja desktopowa w Pythonie ShelfMedia, w 100% spójna z wersją Preview:
  - Identyczny układ graficzny jak w aplikacji Web / Preview:
      * Ciemny ciemny motyw (#0f1722, #141d2b, #1b2838, #66c0f4)
      * Zakładki roczników (Wszystkie lata, 2026, 2025...) z licznikami
      * Czytelne, przestronne karty wierszy (tytuł + cytat recenzji, kolorowe pigułki typów,
        odznaki platform, złote oceny ⭐, statusy z kropkami, bezpośrednie przyciski edycji i usuwania)
      * 100% offline, lokalna baza SQLite (media_tracker.db)
      * Dzieła Roku (Gra, Książka, Film, Serial)
      * Zarządzanie listami wyboru (platformy/formaty i gatunki)
      * Eksport grafiki na Sociale (Podsumowanie PNG)
      * Import i Eksport CSV
      * Wbudowany serwer lokalny Web (możliwość uruchomienia w przeglądarce 1 kliknięciem)
=============================================================================
"""

import sys
import os
import sqlite3
import csv
import threading
import webbrowser
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

# Weryfikacja Tkinter
try:
    import tkinter as tk
    from tkinter import messagebox, filedialog, ttk
except ImportError:
    print("\n[BŁĄD] Moduł 'tkinter' nie jest zainstalowany w Twoim środowisku Pythona!")
    print("Na systemach Linux (Ubuntu/Debian) zainstaluj go poleceniem:")
    print("    sudo apt install python3-tk\n")
    sys.exit(1)

# Weryfikacja CustomTkinter
try:
    import customtkinter as ctk
except ImportError:
    print("\n[BŁĄD] Biblioteka 'customtkinter' nie jest zainstalowana!")
    print("Zainstaluj wymagane pakiety wpisując w terminalu:")
    print("    pip install customtkinter matplotlib\n")
    sys.exit(1)

# Weryfikacja Matplotlib
try:
    import matplotlib
    matplotlib.use("TkAgg")
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    from matplotlib.figure import Figure
except ImportError:
    print("\n[BŁĄD] Biblioteka 'matplotlib' nie jest zainstalowana!")
    print("Zainstaluj wymagane pakiety wpisując w terminalu:")
    print("    pip install customtkinter matplotlib\n")
    sys.exit(1)


# =============================================================================
# 1. BAZA DANYCH SQLITE & DOMYŚLNE DANE
# =============================================================================

DEFAULT_PLATFORMS = [
    "PC (Cyfrowa)",
    "GOG / Epic (PC)",
    "PlayStation 5",
    "PlayStation 4",
    "Xbox Series X",
    "Nintendo Switch",
    "Książka papierowa",
    "Kindle / E-book",
    "Legimi",
    "Empik Go",
    "Audiobook / Storytel",
    "Audible",
    "Netflix",
    "Max (HBO)",
    "Disney+",
    "Prime Video",
    "Kino / IMAX",
    "Inna"
]

DEFAULT_GENRES = [
    "RPG",
    "Sci-Fi",
    "Fantasy",
    "Akcja / Otwarty świat",
    "RPG akcji",
    "Soulslike",
    "Kryminał",
    "Thriller",
    "Dramat / Historyczny",
    "Horror",
    "Metroidvania",
    "Post-apo",
    "Biograficzny",
    "Komedia",
    "Sandbox",
    "Inny"
]

SAMPLE_MEDIA_ITEMS = [
    (1, "Grand Theft Auto VI", 2026, "Gra", "PlayStation 5", "Akcja / Otwarty świat", 9.5, "W trakcie", 45.0, "2026-10-05", "Vice City wygląda oszałamiająco. Niesamowity poziom detali i fizyki świata."),
    (2, "The Blood of Dawnwalker", 2026, "Gra", "PC (Cyfrowa)", "RPG akcji", 8.0, "Ukończone", 42.0, "2026-10-04", "Świetna mroczna oprawa, wymagający system walki i gęsty klimat dark fantasy."),
    (3, "Projekt Hail Mary (Andy Weir)", 2021, "Książka", "Audiobook / Storytel", "Sci-Fi", 10.0, "Ukończone", 18.5, "2026-03-14", "Absolutne arcydzieło science-fiction, fantastyczny lektor i wzruszająca przyjaźń z Rockym."),
    (4, "Wiedźmin: Ostatnie życzenie", 1993, "Książka", "Książka papierowa", "Fantasy", 9.0, "Ukończone", 12.0, "2026-02-10", "Znakomity powrót do opowiadań o Geralcie z Rivii. Humor, sarkazm i słowiański folklor."),
    (5, "Diuna: Proroctwo", 2026, "Serial", "Max (HBO)", "Sci-Fi", 9.0, "Ukończone", 8.0, "2026-03-10", "Fascynująca geneza zakonu Bene Gesserit w uniwersum Franka Herberta."),
    (6, "Wiedźmin 3: Dziki Gon", 2015, "Gra", "PC (Cyfrowa)", "RPG", 10.0, "Ukończone", 145.5, "2024-01-15", "Jedna z najlepszych gier wszech czasów. Dodatki Krew i Wino to absolutne mistrzostwo narracyjne."),
    (7, "Cyberpunk 2077: Phantom Liberty", 2023, "Gra", "PC (Cyfrowa)", "RPG / Sci-Fi", 9.5, "Ukończone", 86.0, "2024-03-20", "Po patchu 2.0 i z dodatkiem gra wreszcie spełniła wszystkie obietnice. Dogtown ma genialny klimat."),
    (8, "Diuna: Część Druga", 2024, "Film", "Kino / IMAX", "Sci-Fi", 9.0, "Ukończone", 2.8, "2024-03-05", "Niesamowita oprawa audiowizualna Hansa Zimmera i Villeneuva. Prawdziwe widowisko kinowe."),
    (9, "Problem trzech ciał (Cixin Liu)", 2008, "Książka", "Kindle / E-book", "Sci-Fi", 9.5, "Ukończone", 16.0, "2024-06-12", "Genialna koncepcja kontaktu z obcą cywilizacją, fizyki kwantowej i paradoksu Fermiego."),
    (10, "Szogun (Shōgun)", 2024, "Serial", "Disney+", "Dramat / Historyczny", 9.0, "Ukończone", 10.0, "2024-04-25", "Świetna adaptacja powieści Jamesa Clavella, doskonała gra aktorska Hiroyukiego Sanady."),
    (11, "Elden Ring: Shadow of the Erdtree", 2024, "Gra", "PC (Cyfrowa)", "Soulslike", 9.5, "Ukończone", 54.0, "2024-07-02", "Jeden z najlepszych dodatków w historii gier wideo. Wymagający, piękny i tajemniczy."),
    (12, "Fallout", 2024, "Serial", "Prime Video", "Post-apo", 8.0, "Ukończone", 8.0, "2024-05-01", "Świetny retrofuturyzm, czarny humor i idealne oddanie estetyki uniwersum Fallouta."),
    (13, "Diuna (Frank Herbert)", 1965, "Książka", "Kindle / E-book", "Sci-Fi", 9.5, "Ukończone", 26.0, "2025-04-18", "Niezrównany świat Arrakis, intrygi polityczne Bene Gesserit i mistycyzm pustyni."),
    (14, "Oppenheimer", 2023, "Film", "Kino / IMAX", "Biograficzny", 8.5, "Ukończone", 3.0, "2023-11-12", "Świetne tempo i montaż dźwięku w filmie Christophera Nolana. Cillian Murphy w życiowej roli."),
    (15, "The Last of Us", 2023, "Serial", "Max (HBO)", "Post-apo", 8.5, "Ukończone", 9.0, "2023-03-14", "Bardzo wierna i emocjonująca adaptacja gry Naughty Dog od twórców Czarnobyla."),
    (16, "Hollow Knight", 2017, "Gra", "Nintendo Switch", "Metroidvania", 9.5, "Ukończone", 42.0, "2023-08-19", "Cudowny klimat, muzyka i wysoki poziom wyzwania. Czekamy na Silksong!"),
    (17, "Starfield", 2023, "Gra", "PC (Cyfrowa)", "RPG", 6.0, "Porzucone", 18.5, "2023-09-28", "Zbyt dużo powtarzalnych planet i ekranów ładowania. Fabuła nie wciągnęła na dłużej.")
]


class DatabaseManager:
    """Zarządza lokalną bazą danych SQLite."""

    def __init__(self, db_name="media_tracker.db"):
        self.db_name = db_name
        self.init_database()
        self.seed_sample_data_if_empty()
        self.seed_default_options_if_empty()

    def get_connection(self):
        return sqlite3.connect(self.db_name)

    def init_database(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS media_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    year INTEGER,
                    item_type TEXT NOT NULL,
                    platform TEXT,
                    genre TEXT,
                    rating REAL,
                    status TEXT NOT NULL,
                    hours_spent REAL DEFAULT 0,
                    date_logged TEXT,
                    comment TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS custom_options (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    value TEXT NOT NULL UNIQUE
                )
            """)
            conn.commit()

    def seed_default_options_if_empty(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM custom_options")
            if cursor.fetchone()[0] == 0:
                for p in DEFAULT_PLATFORMS:
                    cursor.execute("INSERT OR IGNORE INTO custom_options (category, value) VALUES ('platform', ?)", (p,))
                for g in DEFAULT_GENRES:
                    cursor.execute("INSERT OR IGNORE INTO custom_options (category, value) VALUES ('genre', ?)", (g,))
                conn.commit()

    def get_options(self, category):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM custom_options WHERE category = ? ORDER BY value COLLATE NOCASE ASC", (category,))
            return [row[0] for row in cursor.fetchall()]

    def add_option(self, category, value):
        val = value.strip()
        if not val:
            return False
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("INSERT INTO custom_options (category, value) VALUES (?, ?)", (category, val))
                conn.commit()
                return True
            except sqlite3.IntegrityError:
                return False

    def delete_option(self, category, value):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM custom_options WHERE category = ? AND value = ?", (category, value))
            conn.commit()

    def reset_options(self, category):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM custom_options WHERE category = ?", (category,))
            defaults = DEFAULT_PLATFORMS if category == "platform" else DEFAULT_GENRES
            for item in defaults:
                cursor.execute("INSERT OR IGNORE INTO custom_options (category, value) VALUES (?, ?)", (category, item))
            conn.commit()

    def seed_sample_data_if_empty(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM media_items")
            if cursor.fetchone()[0] == 0:
                cursor.executemany("""
                    INSERT INTO media_items (id, title, year, item_type, platform, genre, rating, status, hours_spent, date_logged, comment)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, SAMPLE_MEDIA_ITEMS)
                conn.commit()

    def reset_to_sample_data(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM media_items")
            cursor.executemany("""
                INSERT INTO media_items (id, title, year, item_type, platform, genre, rating, status, hours_spent, date_logged, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, SAMPLE_MEDIA_ITEMS)
            conn.commit()

    def add_item(self, data):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO media_items (title, year, item_type, platform, genre, rating, status, hours_spent, date_logged, comment)
                VALUES (:title, :year, :item_type, :platform, :genre, :rating, :status, :hours_spent, :date_logged, :comment)
            """, data)
            conn.commit()
            return cursor.lastrowid

    def update_item(self, item_id, data):
        data['id'] = item_id
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE media_items
                SET title = :title,
                    year = :year,
                    item_type = :item_type,
                    platform = :platform,
                    genre = :genre,
                    rating = :rating,
                    status = :status,
                    hours_spent = :hours_spent,
                    date_logged = :date_logged,
                    comment = :comment
                WHERE id = :id
            """, data)
            conn.commit()

    def delete_item(self, item_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM media_items WHERE id = ?", (item_id,))
            conn.commit()

    def delete_multiple(self, item_ids):
        if not item_ids:
            return
        with self.get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" for _ in item_ids)
            cursor.execute(f"DELETE FROM media_items WHERE id IN ({placeholders})", item_ids)
            conn.commit()

    def get_item(self, item_id):
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM media_items WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_distinct_years_with_counts(self):
        """Zwraca słownik {rocznik: liczba_pozycji}."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, year, date_logged FROM media_items")
            rows = cursor.fetchall()

            counts = {}
            for row in rows:
                yr = None
                date_str = row[2]
                if date_str and len(date_str) >= 4 and date_str[:4].isdigit():
                    yr = date_str[:4]
                elif row[1]:
                    yr = str(row[1])

                if yr:
                    counts[yr] = counts.get(yr, 0) + 1

            return counts

    def get_items(self, search_query="", item_type="Wszystkie media", status="Wszystkie statusy", year="Wszystkie lata", sort_by="date_logged", sort_desc=True):
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            query = "SELECT * FROM media_items WHERE 1=1"
            params = []

            if search_query:
                query += " AND (title LIKE ? OR genre LIKE ? OR platform LIKE ? OR comment LIKE ?)"
                wildcard = f"%{search_query.strip()}%"
                params.extend([wildcard, wildcard, wildcard, wildcard])

            if item_type and item_type not in ("Wszystkie media", "Wszystkie"):
                query += " AND item_type = ?"
                params.append(item_type)

            if status and status not in ("Wszystkie statusy", "Wszystkie"):
                query += " AND status = ?"
                params.append(status)

            if year and year not in ("Wszystkie lata", "Wszystkie"):
                query += " AND (SUBSTR(date_logged, 1, 4) = ? OR CAST(year AS TEXT) = ?)"
                params.extend([str(year), str(year)])

            allowed_sorts = {
                "title": "title COLLATE NOCASE",
                "year": "year",
                "rating": "rating",
                "hours_spent": "hours_spent",
                "date_logged": "date_logged",
                "id": "id"
            }
            col = allowed_sorts.get(sort_by, "date_logged")
            direction = "DESC" if sort_desc else "ASC"
            query += f" ORDER BY {col} {direction}, id DESC"

            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_statistics(self, platform_year="Wszystkie", genre_type="Wszystkie", genre_year="Wszystkie"):
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    COUNT(*) as total_count,
                    COALESCE(SUM(hours_spent), 0) as total_hours,
                    COALESCE(AVG(rating), 0) as avg_rating,
                    COALESCE(SUM(CASE WHEN status = 'Ukończone' THEN 1 ELSE 0 END), 0) as completed_count,
                    COALESCE(SUM(CASE WHEN status = 'W trakcie' THEN 1 ELSE 0 END), 0) as in_progress_count,
                    COALESCE(SUM(CASE WHEN item_type = 'Gra' THEN hours_spent ELSE 0 END), 0) as game_hours,
                    COALESCE(SUM(CASE WHEN item_type = 'Książka' THEN hours_spent ELSE 0 END), 0) as book_hours,
                    COALESCE(SUM(CASE WHEN item_type = 'Film' THEN hours_spent ELSE 0 END), 0) as movie_hours,
                    COALESCE(SUM(CASE WHEN item_type = 'Serial' THEN hours_spent ELSE 0 END), 0) as series_hours
                FROM media_items
            """)
            summary_row = cursor.fetchone()

            p_query = """
                SELECT platform, SUM(hours_spent) as total_h
                FROM media_items
                WHERE platform IS NOT NULL AND platform != '' AND hours_spent > 0
            """
            p_params = []
            if platform_year != "Wszystkie":
                p_query += " AND (SUBSTR(date_logged, 1, 4) = ? OR CAST(year AS TEXT) = ?)"
                p_params.extend([platform_year, platform_year])
            p_query += " GROUP BY platform ORDER BY total_h DESC LIMIT 7"
            cursor.execute(p_query, p_params)
            platform_hours = [(row["platform"], row["total_h"]) for row in cursor.fetchall()]

            g_query = """
                SELECT genre, SUM(hours_spent) as total_h, COUNT(*) as titles_count
                FROM media_items
                WHERE genre IS NOT NULL AND genre != ''
            """
            g_params = []
            if genre_type != "Wszystkie":
                g_query += " AND item_type = ?"
                g_params.append(genre_type)
            if genre_year != "Wszystkie":
                g_query += " AND (SUBSTR(date_logged, 1, 4) = ? OR CAST(year AS TEXT) = ?)"
                g_params.extend([genre_year, genre_year])
            g_query += " GROUP BY genre ORDER BY total_h DESC LIMIT 8"
            cursor.execute(g_query, g_params)
            genre_hours = [(row["genre"], row["total_h"], row["titles_count"]) for row in cursor.fetchall()]

            return {
                "total_count": summary_row["total_count"],
                "total_hours": round(summary_row["total_hours"], 1),
                "avg_rating": round(summary_row["avg_rating"], 1),
                "completed_count": summary_row["completed_count"],
                "in_progress_count": summary_row["in_progress_count"],
                "game_hours": round(summary_row["game_hours"], 1),
                "book_hours": round(summary_row["book_hours"], 1),
                "movie_hours": round(summary_row["movie_hours"], 1),
                "series_hours": round(summary_row["series_hours"], 1),
                "platform_hours": platform_hours,
                "genre_hours": genre_hours,
            }

    def get_year_awards(self, year="2026"):
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            categories = ["Gra", "Książka", "Film", "Serial"]
            awards = {}
            for cat in categories:
                if year == "Wszystkie":
                    cursor.execute("""
                        SELECT * FROM media_items
                        WHERE item_type = ?
                        ORDER BY rating DESC, hours_spent DESC, id DESC
                        LIMIT 1
                    """, (cat,))
                else:
                    cursor.execute("""
                        SELECT * FROM media_items
                        WHERE item_type = ? AND (SUBSTR(date_logged, 1, 4) = ? OR CAST(year AS TEXT) = ?)
                        ORDER BY rating DESC, hours_spent DESC, id DESC
                        LIMIT 1
                    """, (cat, year, year))
                row = cursor.fetchone()
                awards[cat] = dict(row) if row else None

            return awards


# =============================================================================
# 2. DESIGN & KOLORYSTYKA DOKŁADNIE JAK W PREVIEW
# =============================================================================

THEME = {
    "bg_app": "#0f1722",           # Tło całej aplikacji
    "bg_header": "#171a21",        # Górny pasek nawigacji Steam
    "bg_banner": "#141d2b",        # Panel informacyjny
    "bg_card": "#151f2e",          # Tło wiersza w tabeli
    "bg_card_hover": "#1c2a3e",    # Hover wiersza
    "bg_input": "#101722",         # Tło pól tekstowych
    "border": "#243547",           # Podstawowa ramka
    "border_cyan": "#2b567a",      # Podświetlenie
    "text_white": "#ffffff",       # Tytuły
    "text_light": "#c7d5e0",       # Tekst tabeli
    "text_muted": "#8f98a0",       # Recenzje w kursywie, etykiety
    "cyan": "#66c0f4",             # Steam Cyan
    "green": "#5c7e10",            # Dodaj pozycję
    "green_hover": "#79a313",
    "red": "#782222",              # Usuń
    "red_hover": "#a82b2b",
    "gold": "#f1c40f",             # Gwiazdki i oceny
    # Odznaki Typu
    "badge_game_bg": "#142d47",
    "badge_game_fg": "#66c0f4",
    "badge_book_bg": "#38240d",
    "badge_book_fg": "#f59e0b",
    "badge_movie_bg": "#2c1742",
    "badge_movie_fg": "#c084fc",
    "badge_series_bg": "#123028",
    "badge_series_fg": "#2dd4bf",
    # Odznaki Statusu
    "status_prog_bg": "#38230b",
    "status_prog_fg": "#fb923c",
    "status_done_bg": "#112f1c",
    "status_done_fg": "#4ade80",
    "status_plan_bg": "#162b42",
    "status_plan_fg": "#60a5fa",
    "status_drop_bg": "#381313",
    "status_drop_fg": "#f87171"
}


# =============================================================================
# 3. MODAL DODAWANIA / EDYCJI POZYCJI
# =============================================================================

class MediaItemDialog(ctk.CTkToplevel):
    """Okno formularza dodawania i edycji dzieła."""

    def __init__(self, parent, db: DatabaseManager, item_data=None, on_save_callback=None, on_delete_callback=None):
        super().__init__(parent)
        self.db = db
        self.item_data = item_data
        self.on_save_callback = on_save_callback
        self.on_delete_callback = on_delete_callback
        self.is_edit_mode = item_data is not None

        title_text = "Edytuj dzieło w bazie" if self.is_edit_mode else "Dodaj nowe dzieło do biblioteki"
        self.title(title_text)
        self.geometry("580x740")
        self.configure(fg_color=THEME["bg_banner"])
        self.transient(parent)
        self.grab_set()

        self._build_form()

    def _build_form(self):
        # Header
        header = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=64, corner_radius=0)
        header.pack(fill="x")

        title_lbl = ctk.CTkLabel(
            header,
            text="✏️ Edycja wpisu" if self.is_edit_mode else "➕ Nowa pozycja w bibliotece",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=THEME["cyan"]
        )
        title_lbl.pack(side="left", padx=20, pady=16)

        body = ctk.CTkScrollableFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=22, pady=12)

        # 1. Tytuł
        lbl_t = ctk.CTkLabel(body, text="TYTUŁ DZIEŁA *", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"])
        lbl_t.pack(anchor="w", pady=(4, 2))
        self.entry_title = ctk.CTkEntry(body, placeholder_text="np. Grand Theft Auto VI, Projekt Hail Mary...", height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_title.pack(fill="x", pady=(0, 12))

        # 2. Typ i Rok
        row1 = ctk.CTkFrame(body, fg_color="transparent")
        row1.pack(fill="x", pady=(0, 12))
        row1.columnconfigure(0, weight=1)
        row1.columnconfigure(1, weight=1)

        b_type = ctk.CTkFrame(row1, fg_color="transparent")
        b_type.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        ctk.CTkLabel(b_type, text="TYP MEDIUM *", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        self.combo_type = ctk.CTkComboBox(b_type, values=["Gra", "Książka", "Film", "Serial"], height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.combo_type.set("Gra")
        self.combo_type.pack(fill="x")

        b_year = ctk.CTkFrame(row1, fg_color="transparent")
        b_year.grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        ctk.CTkLabel(b_year, text="ROK PREMIERY / WYDANIA", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        self.entry_year = ctk.CTkEntry(b_year, placeholder_text="np. 2026", height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_year.pack(fill="x")

        # 3. Platforma / Format & Gatunek
        row2 = ctk.CTkFrame(body, fg_color="transparent")
        row2.pack(fill="x", pady=(0, 12))
        row2.columnconfigure(0, weight=1)
        row2.columnconfigure(1, weight=1)

        b_plat = ctk.CTkFrame(row2, fg_color="transparent")
        b_plat.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        ctk.CTkLabel(b_plat, text="PLATFORMA / FORMAT", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        plats = self.db.get_options("platform")
        self.combo_plat = ctk.CTkComboBox(b_plat, values=plats, height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.combo_plat.set(plats[0] if plats else "PC (Cyfrowa)")
        self.combo_plat.pack(fill="x")

        b_gen = ctk.CTkFrame(row2, fg_color="transparent")
        b_gen.grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        ctk.CTkLabel(b_gen, text="GATUNEK", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        genres = self.db.get_options("genre")
        self.combo_genre = ctk.CTkComboBox(b_gen, values=genres, height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.combo_genre.set(genres[0] if genres else "Akcja / Otwarty świat")
        self.combo_genre.pack(fill="x")

        # 4. Status i Ocena
        row3 = ctk.CTkFrame(body, fg_color="transparent")
        row3.pack(fill="x", pady=(0, 12))
        row3.columnconfigure(0, weight=1)
        row3.columnconfigure(1, weight=1)

        b_stat = ctk.CTkFrame(row3, fg_color="transparent")
        b_stat.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        ctk.CTkLabel(b_stat, text="STATUS *", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        self.combo_status = ctk.CTkComboBox(b_stat, values=["Ukończone", "W trakcie", "Planowane", "Porzucone"], height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.combo_status.set("Ukończone")
        self.combo_status.pack(fill="x")

        b_rate = ctk.CTkFrame(row3, fg_color="transparent")
        b_rate.grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        rate_bar = ctk.CTkFrame(b_rate, fg_color="transparent")
        rate_bar.pack(fill="x")
        ctk.CTkLabel(rate_bar, text="OCENA (1-10)", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(side="left")
        self.lbl_rate_val = ctk.CTkLabel(rate_bar, text="8.0 ★", font=ctk.CTkFont(size=13, weight="bold"), text_color=THEME["gold"])
        self.lbl_rate_val.pack(side="right")

        self.slider_rate = ctk.CTkSlider(b_rate, from_=1.0, to=10.0, number_of_steps=18, progress_color=THEME["gold"], button_color=THEME["cyan"], command=self._on_rate_change)
        self.slider_rate.set(8.0)
        self.slider_rate.pack(fill="x", pady=(6, 0))

        # 5. Czas i Data
        row4 = ctk.CTkFrame(body, fg_color="transparent")
        row4.pack(fill="x", pady=(0, 12))
        row4.columnconfigure(0, weight=1)
        row4.columnconfigure(1, weight=1)

        b_time = ctk.CTkFrame(row4, fg_color="transparent")
        b_time.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        ctk.CTkLabel(b_time, text="CZAS SPĘDZONY (H)", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        self.entry_hours = ctk.CTkEntry(b_time, placeholder_text="np. 45.0", height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_hours.pack(fill="x")

        b_date = ctk.CTkFrame(row4, fg_color="transparent")
        b_date.grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        ctk.CTkLabel(b_date, text="DATA OCENY (RRRR-MM-DD)", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        today_s = datetime.today().strftime("%Y-%m-%d")
        self.entry_date = ctk.CTkEntry(b_date, placeholder_text=today_s, height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_date.insert(0, today_s)
        self.entry_date.pack(fill="x")

        # 6. Komentarz
        ctk.CTkLabel(body, text="WŁASNA RECENZJA / CYTAT / NOTATKA", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(4, 2))
        self.text_comment = ctk.CTkTextbox(body, height=90, fg_color=THEME["bg_input"], border_color=THEME["border"], border_width=1)
        self.text_comment.pack(fill="x", pady=(0, 10))

        # Wypełnienie jeśli edycja
        if self.is_edit_mode:
            self.entry_title.insert(0, self.item_data.get("title", ""))
            if self.item_data.get("year"):
                self.entry_year.insert(0, str(self.item_data["year"]))
            self.combo_type.set(self.item_data.get("item_type", "Gra"))
            self.combo_plat.set(self.item_data.get("platform", "PC (Cyfrowa)"))
            self.combo_genre.set(self.item_data.get("genre", "Akcja / Otwarty świat"))
            self.combo_status.set(self.item_data.get("status", "Ukończone"))

            r_val = float(self.item_data.get("rating", 8.0))
            self.slider_rate.set(r_val)
            self.lbl_rate_val.configure(text=f"{r_val:.1f} ★")

            h_val = self.item_data.get("hours_spent", 0)
            self.entry_hours.insert(0, str(h_val) if h_val else "")

            d_val = self.item_data.get("date_logged", "")
            if d_val:
                self.entry_date.delete(0, tk.END)
                self.entry_date.insert(0, d_val)

            c_val = self.item_data.get("comment", "")
            if c_val:
                self.text_comment.insert("1.0", c_val)

        # Stopka
        footer = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=64, corner_radius=0)
        footer.pack(fill="x", side="bottom")

        if self.is_edit_mode and self.on_delete_callback:
            btn_del = ctk.CTkButton(
                footer,
                text="🗑️ Usuń z bazy",
                width=120,
                height=36,
                fg_color=THEME["red"],
                hover_color=THEME["red_hover"],
                command=self._delete_action
            )
            btn_del.pack(side="left", padx=16, pady=14)

        btn_cancel = ctk.CTkButton(
            footer,
            text="Anuluj",
            width=90,
            height=36,
            fg_color="#212b3b",
            hover_color="#2a475e",
            command=self.destroy
        )
        btn_cancel.pack(side="right", padx=(6, 16), pady=14)

        btn_save = ctk.CTkButton(
            footer,
            text="💾 Zapisz zmiany" if self.is_edit_mode else "➕ Dodaj dzieło",
            width=135,
            height=36,
            fg_color=THEME["green"],
            hover_color=THEME["green_hover"],
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._save_action
        )
        btn_save.pack(side="right", padx=6, pady=14)

    def _on_rate_change(self, val):
        self.lbl_rate_val.configure(text=f"{val:.1f} ★")

    def _delete_action(self):
        title = self.item_data.get("title", "pozycję")
        if messagebox.askyesno("Potwierdzenie usunięcia", f"Czy na pewno chcesz bezpowrotnie usunąć z bazy:\n\n'{title}'?", parent=self):
            if self.on_delete_callback:
                self.on_delete_callback(self.item_data["id"])
            self.destroy()

    def _save_action(self):
        title = self.entry_title.get().strip()
        if not title:
            messagebox.showwarning("Brak danych", "Tytuł dzieła jest wymagany!", parent=self)
            return

        year_str = self.entry_year.get().strip()
        year = None
        if year_str:
            try:
                year = int(year_str)
            except ValueError:
                messagebox.showerror("Błąd", "Wprowadź poprawny rok (np. 2026)!", parent=self)
                return

        hours_str = self.entry_hours.get().strip().replace(",", ".")
        hours = 0.0
        if hours_str:
            try:
                hours = float(hours_str)
            except ValueError:
                messagebox.showerror("Błąd", "Czas musi być liczbą godzin (np. 45.0)!", parent=self)
                return

        date_str = self.entry_date.get().strip() or datetime.today().strftime("%Y-%m-%d")

        data = {
            "title": title,
            "year": year,
            "item_type": self.combo_type.get(),
            "platform": self.combo_plat.get().strip(),
            "genre": self.combo_genre.get().strip(),
            "rating": round(self.slider_rate.get(), 1),
            "status": self.combo_status.get(),
            "hours_spent": hours,
            "date_logged": date_str,
            "comment": self.text_comment.get("1.0", tk.END).strip()
        }

        if self.on_save_callback:
            self.on_save_callback(data)

        self.destroy()


# =============================================================================
# 4. MODAL ZARZĄDZANIA LISTAMI WYBORU (PLATFORMY I GATUNKI)
# =============================================================================

class OptionsManagerDialog(ctk.CTkToplevel):
    """Zarządzanie listami wyboru platform i gatunków."""

    def __init__(self, parent, db: DatabaseManager, on_update_callback=None):
        super().__init__(parent)
        self.db = db
        self.on_update_callback = on_update_callback

        self.title("⚙️ Zarządzaj listami wyboru (Platformy & Gatunki)")
        self.geometry("560x580")
        self.configure(fg_color=THEME["bg_banner"])
        self.transient(parent)
        self.grab_set()

        self._build_ui()

    def _build_ui(self):
        header = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=60, corner_radius=0)
        header.pack(fill="x")

        ctk.CTkLabel(
            header,
            text="⚙️ Listy do wyboru (Platformy / Formaty & Gatunki)",
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=THEME["cyan"]
        ).pack(side="left", padx=20, pady=14)

        tabview = ctk.CTkTabview(
            self,
            fg_color=THEME["bg_banner"],
            segmented_button_fg_color=THEME["bg_header"],
            segmented_button_selected_color="#213b56",
            text_color="#ffffff"
        )
        tabview.pack(fill="both", expand=True, padx=16, pady=12)

        tab_plats = tabview.add("  Platformy / Formaty  ")
        tab_gens = tabview.add("  Gatunki  ")

        self._build_section(tab_plats, "platform", "np. Nintendo Switch 2, Apple TV+, Legimi...")
        self._build_section(tab_gens, "genre", "np. Cyberpunk, Roguelike, Reportaż...")

        footer = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=50, corner_radius=0)
        footer.pack(fill="x", side="bottom")

        ctk.CTkButton(
            footer,
            text="Zamknij",
            fg_color="#212b3b",
            hover_color="#2a475e",
            width=100,
            command=self.destroy
        ).pack(side="right", padx=16, pady=10)

    def _build_section(self, parent_tab, category, placeholder):
        add_box = ctk.CTkFrame(parent_tab, fg_color="transparent")
        add_box.pack(fill="x", padx=4, pady=(6, 10))

        entry = ctk.CTkEntry(add_box, placeholder_text=placeholder, height=36, fg_color=THEME["bg_input"], border_color=THEME["border"])
        entry.pack(side="left", fill="x", expand=True, padx=(0, 8))

        def add_item():
            val = entry.get().strip()
            if not val:
                return
            if self.db.add_option(category, val):
                entry.delete(0, tk.END)
                refresh()
                if self.on_update_callback:
                    self.on_update_callback()
            else:
                messagebox.showwarning("Duplikat", f"'{val}' już znajduje się na liście!", parent=self)

        ctk.CTkButton(add_box, text="➕ Dodaj", width=90, height=36, fg_color=THEME["green"], hover_color=THEME["green_hover"], font=ctk.CTkFont(size=12, weight="bold"), command=add_item).pack(side="right")
        entry.bind("<Return>", lambda e: add_item())

        scroll = ctk.CTkScrollableFrame(parent_tab, fg_color=THEME["bg_app"], corner_radius=8)
        scroll.pack(fill="both", expand=True, padx=4, pady=4)

        def refresh():
            for w in scroll.winfo_children():
                w.destroy()
            items = self.db.get_options(category)
            for it in items:
                row = ctk.CTkFrame(scroll, fg_color=THEME["bg_card"], corner_radius=6, height=34)
                row.pack(fill="x", padx=4, pady=2)
                ctk.CTkLabel(row, text=f"•  {it}", font=ctk.CTkFont(size=12), text_color=THEME["text_white"]).pack(side="left", padx=12, pady=6)

                def make_del(val=it):
                    return lambda: del_action(val)

                ctk.CTkButton(row, text="✕", width=28, height=24, fg_color=THEME["red"], hover_color=THEME["red_hover"], command=make_del()).pack(side="right", padx=6, pady=4)

        def del_action(val):
            if messagebox.askyesno("Usuwanie", f"Usunąć '{val}' z listy wyboru?", parent=self):
                self.db.delete_option(category, val)
                refresh()
                if self.on_update_callback:
                    self.on_update_callback()

        bottom = ctk.CTkFrame(parent_tab, fg_color="transparent")
        bottom.pack(fill="x", padx=4, pady=(8, 0))

        def reset_all():
            if messagebox.askyesno("Reset", "Czy na pewno przywrócić listę domyślną?", parent=self):
                self.db.reset_options(category)
                refresh()
                if self.on_update_callback:
                    self.on_update_callback()

        ctk.CTkButton(bottom, text="🔄 Przywróć domyślne", fg_color="transparent", text_color=THEME["text_muted"], hover_color=THEME["bg_card"], height=28, font=ctk.CTkFont(size=11), command=reset_all).pack(side="right")

        refresh()


# =============================================================================
# 5. GŁÓWNA APLIKACJA — INTERFEJS STEAM DOKŁADNIE JAK W PREVIEW
# =============================================================================

class MediaTrackerApp(ctk.CTk):
    """Główne okno aplikacji ShelfMedia identyczne z web preview."""

    def __init__(self):
        super().__init__()

        self.db = DatabaseManager("media_tracker.db")

        # Okno aplikacji
        self.title("SHELFMEDIA — Gry, Książki, Filmy i Seriale")
        self.geometry("1280x820")
        self.minsize(1080, 680)

        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        self.configure(fg_color=THEME["bg_app"])

        # Stan filtrów
        self.active_year = "Wszystkie lata"
        self.active_tab = "library"
        self.selected_ids = set()
        self._search_timer = None

        self._build_top_navbar()
        self._build_main_content()
        self.refresh_year_bookmarks()
        self.refresh_library()

    # -------------------------------------------------------------------------
    # 5.1 GÓRNY PASEK SHELFMEDIA (LOGO + TABS + AKCJE)
    # -------------------------------------------------------------------------
    def _build_top_navbar(self):
        nav = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=64, corner_radius=0)
        nav.pack(fill="x", side="top")

        # Lewo: Logo ShelfMedia + Tytuł + Badge
        brand = ctk.CTkFrame(nav, fg_color="transparent")
        brand.pack(side="left", padx=16, pady=10)

        # Gamepad icon container
        icon_box = ctk.CTkFrame(brand, fg_color="#183654", width=38, height=38, corner_radius=8)
        icon_box.pack(side="left", padx=(0, 10))
        icon_box.pack_propagate(False)
        ctk.CTkLabel(icon_box, text="🎮", font=ctk.CTkFont(size=18)).pack(expand=True)

        text_box = ctk.CTkFrame(brand, fg_color="transparent")
        text_box.pack(side="left")

        ctk.CTkLabel(text_box, text="SHELFMEDIA", font=ctk.CTkFont(size=15, weight="bold"), text_color="#ffffff").pack(anchor="w")
        ctk.CTkLabel(text_box, text="Gry, Książki 📖, Filmy i Seriale", font=ctk.CTkFont(size=10), text_color=THEME["text_muted"]).pack(anchor="w")

        self.lbl_badge = ctk.CTkLabel(
            brand,
            text="v2.0 Gry • Książki • Ekrany  •  Baza: 17 pozycji",
            font=ctk.CTkFont(size=10),
            text_color=THEME["cyan"],
            fg_color="#1a2d42",
            corner_radius=4,
            padx=8,
            pady=3
        )
        self.lbl_badge.pack(side="left", padx=(12, 0))

        # Środek: Przyciski Zakładek Nawigacji
        tabs_box = ctk.CTkFrame(nav, fg_color="transparent")
        tabs_box.pack(side="left", padx=(30, 0))

        self.btn_tab_lib = ctk.CTkButton(
            tabs_box,
            text="|||\\ Biblioteka",
            width=115,
            height=36,
            fg_color="#213955",
            hover_color="#28486d",
            text_color=THEME["cyan"],
            font=ctk.CTkFont(size=12, weight="bold"),
            corner_radius=6,
            command=lambda: self._switch_tab("library")
        )
        self.btn_tab_lib.pack(side="left", padx=3)

        self.btn_tab_stats = ctk.CTkButton(
            tabs_box,
            text="📊 Statystyki & Roczniki",
            width=155,
            height=36,
            fg_color="transparent",
            hover_color="#1a2738",
            text_color=THEME["text_muted"],
            font=ctk.CTkFont(size=12, weight="bold"),
            corner_radius=6,
            command=lambda: self._switch_tab("stats")
        )
        self.btn_tab_stats.pack(side="left", padx=3)

        # Prawo: Pasek przycisków akcji
        actions = ctk.CTkFrame(nav, fg_color="transparent")
        actions.pack(side="right", padx=16, pady=10)

        # Przycisk: Dodaj pozycję (Z I E L O N Y)
        btn_add = ctk.CTkButton(
            actions,
            text="➕ Dodaj pozycję",
            width=125,
            height=36,
            fg_color=THEME["green"],
            hover_color=THEME["green_hover"],
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self.open_add_dialog
        )
        btn_add.pack(side="right", padx=(6, 0))

        # Przycisk: Sociale
        btn_social = ctk.CTkButton(
            actions,
            text="📱 Sociale",
            width=90,
            height=36,
            fg_color="#1a2d42",
            hover_color="#25415e",
            text_color="#ffffff",
            font=ctk.CTkFont(size=11, weight="bold"),
            command=self.export_social_graphic
        )
        btn_social.pack(side="right", padx=(6, 0))

        # Przycisk: Listy wyboru
        btn_options = ctk.CTkButton(
            actions,
            text="⚙ Listy wyboru",
            width=110,
            height=36,
            fg_color="#1a2433",
            hover_color="#233247",
            text_color=THEME["text_light"],
            font=ctk.CTkFont(size=11),
            command=self.open_options_manager
        )
        btn_options.pack(side="right", padx=(6, 0))

        # Przycisk: Eksport CSV
        btn_export = ctk.CTkButton(
            actions,
            text="⬇ Eksport CSV",
            width=105,
            height=36,
            fg_color="#1a2433",
            hover_color="#233247",
            text_color=THEME["text_light"],
            font=ctk.CTkFont(size=11),
            command=self.export_csv
        )
        btn_export.pack(side="right", padx=(6, 0))

        # Przycisk: Import CSV
        btn_import = ctk.CTkButton(
            actions,
            text="⬆ Import CSV",
            width=100,
            height=36,
            fg_color="#1a2433",
            hover_color="#233247",
            text_color=THEME["text_light"],
            font=ctk.CTkFont(size=11),
            command=self.import_csv
        )
        btn_import.pack(side="right", padx=(6, 0))

        # Przycisk: Reset
        btn_reset = ctk.CTkButton(
            actions,
            text="🔄",
            width=36,
            height=36,
            fg_color="#1a2433",
            hover_color="#233247",
            text_color=THEME["cyan"],
            font=ctk.CTkFont(size=14),
            command=self.reset_sample_data
        )
        btn_reset.pack(side="right", padx=(0, 4))

    # -------------------------------------------------------------------------
    # 5.2 GŁÓWNA ZAWARTOŚĆ
    # -------------------------------------------------------------------------
    def _build_main_content(self):
        self.content_container = ctk.CTkFrame(self, fg_color="transparent")
        self.content_container.pack(fill="both", expand=True, padx=20, pady=12)

        # Kontener zakładki Biblioteka
        self.library_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.library_frame.pack(fill="both", expand=True)

        # Kontener zakładki Statystyki
        self.stats_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")

        self._build_library_view()
        self._build_stats_view()

    def _switch_tab(self, tab):
        self.active_tab = tab
        if tab == "library":
            self.stats_frame.pack_forget()
            self.library_frame.pack(fill="both", expand=True)
            self.btn_tab_lib.configure(fg_color="#213955", text_color=THEME["cyan"])
            self.btn_tab_stats.configure(fg_color="transparent", text_color=THEME["text_muted"])
            self.refresh_library()
        else:
            self.library_frame.pack_forget()
            self.stats_frame.pack(fill="both", expand=True)
            self.btn_tab_lib.configure(fg_color="transparent", text_color=THEME["text_muted"])
            self.btn_tab_stats.configure(fg_color="#213955", text_color=THEME["cyan"])
            self.refresh_stats()

    # -------------------------------------------------------------------------
    # 5.3 ZAKŁADKA BIBLIOTEKI — DOKŁADNA KOPIA PREVIEW
    # -------------------------------------------------------------------------
    def _build_library_view(self):
        # 1. Górny niebieski baner informacyjny
        banner = ctk.CTkFrame(self.library_frame, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        banner.pack(fill="x", pady=(0, 10))

        b_left = ctk.CTkFrame(banner, fg_color="transparent")
        b_left.pack(side="left", fill="both", expand=True, padx=16, pady=10)

        # Rząd 1 banera: Tytuł i badges
        b_top_row = ctk.CTkFrame(b_left, fg_color="transparent")
        b_top_row.pack(fill="x")

        # Ikona bazy
        db_icon_box = ctk.CTkFrame(b_top_row, fg_color="#182738", width=34, height=34, corner_radius=6)
        db_icon_box.pack(side="left", padx=(0, 10))
        db_icon_box.pack_propagate(False)
        ctk.CTkLabel(db_icon_box, text="🗄️", font=ctk.CTkFont(size=16)).pack(expand=True)

        ctk.CTkLabel(
            b_top_row,
            text="Lokalny tracker: Gry • Książki 📖 • Filmy • Seriale",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="#ffffff"
        ).pack(side="left")

        # Badges
        ctk.CTkLabel(
            b_top_row,
            text="100% OFFLINE",
            font=ctk.CTkFont(size=10, weight="bold"),
            text_color="#a4d007",
            fg_color="#1e3415",
            corner_radius=4,
            padx=7,
            pady=2
        ).pack(side="left", padx=(10, 6))

        ctk.CTkLabel(
            b_top_row,
            text="ZAKŁADKI ROCZNIKÓW",
            font=ctk.CTkFont(size=10, weight="bold"),
            text_color=THEME["cyan"],
            fg_color="#162e47",
            corner_radius=4,
            padx=7,
            pady=2
        ).pack(side="left")

        # Rząd 2 banera: opis bazy
        ctk.CTkLabel(
            b_left,
            text="Baza SQLite: media_tracker.db. Zarządzanie platformami/gatunkami, usuwanie z bazy, podział rocznikowy i eksport grafiki na sociale.",
            font=ctk.CTkFont(size=11),
            text_color=THEME["text_muted"]
        ).pack(anchor="w", pady=(4, 0))

        # Przyciski po prawej stronie banera
        b_right = ctk.CTkFrame(banner, fg_color="transparent")
        b_right.pack(side="right", padx=16, pady=10)

        btn_social_banner = ctk.CTkButton(
            b_right,
            text="📱 Grafika na Sociale",
            fg_color="#182738",
            hover_color="#213955",
            border_width=1,
            border_color=THEME["border"],
            text_color="#ffffff",
            font=ctk.CTkFont(size=11),
            height=32,
            command=self.export_social_graphic
        )
        btn_social_banner.pack(side="right", padx=(6, 0))

        btn_web = ctk.CTkButton(
            b_right,
            text="🌐 Otwórz w przeglądarce",
            fg_color="#182738",
            hover_color="#213955",
            border_width=1,
            border_color=THEME["border"],
            text_color=THEME["cyan"],
            font=ctk.CTkFont(size=11),
            height=32,
            command=self.open_in_browser
        )
        btn_web.pack(side="right")

        # 2. Pasek Zakładek Roczników (DOKŁADNIE JAK W PREVIEW)
        self.year_bookmarks_bar = ctk.CTkFrame(self.library_frame, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        self.year_bookmarks_bar.pack(fill="x", pady=(0, 10))

        self.year_inner = ctk.CTkFrame(self.year_bookmarks_bar, fg_color="transparent")
        self.year_inner.pack(fill="x", padx=16, pady=8)

        ctk.CTkLabel(
            self.year_inner,
            text="📅 ZAKŁADKI ROCZNIKÓW:",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=THEME["cyan"]
        ).pack(side="left", padx=(0, 12))

        self.years_buttons_frame = ctk.CTkFrame(self.year_inner, fg_color="transparent")
        self.years_buttons_frame.pack(side="right")

        # 3. Pasek Wyszukiwania i Filtrów
        search_filter_bar = ctk.CTkFrame(self.library_frame, fg_color="transparent")
        search_filter_bar.pack(fill="x", pady=(0, 10))

        self.entry_search = ctk.CTkEntry(
            search_filter_bar,
            placeholder_text="🔍 Szukaj po tytule, autorze, gatunku, platformie lub notatce...",
            height=40,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            font=ctk.CTkFont(size=12)
        )
        self.entry_search.pack(side="left", fill="x", expand=True, padx=(0, 12))
        self.entry_search.bind("<KeyRelease>", self._on_search_key)

        # Filtr Typu
        lbl_ft = ctk.CTkLabel(search_filter_bar, text="Typ:", text_color=THEME["text_muted"], font=ctk.CTkFont(size=12, weight="bold"))
        lbl_ft.pack(side="left", padx=(0, 4))
        self.combo_ftype = ctk.CTkComboBox(
            search_filter_bar,
            values=["Wszystkie media", "Gra", "Książka", "Film", "Serial"],
            height=40,
            width=140,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            command=lambda v: self.refresh_library()
        )
        self.combo_ftype.set("Wszystkie media")
        self.combo_ftype.pack(side="left", padx=(0, 12))

        # Filtr Statusu
        lbl_fs = ctk.CTkLabel(search_filter_bar, text="Status:", text_color=THEME["text_muted"], font=ctk.CTkFont(size=12, weight="bold"))
        lbl_fs.pack(side="left", padx=(0, 4))
        self.combo_fstatus = ctk.CTkComboBox(
            search_filter_bar,
            values=["Wszystkie statusy", "Ukończone", "W trakcie", "Planowane", "Porzucone"],
            height=40,
            width=145,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            command=lambda v: self.refresh_library()
        )
        self.combo_fstatus.set("Wszystkie statusy")
        self.combo_fstatus.pack(side="left", padx=(0, 12))

        self.lbl_positions_count = ctk.CTkLabel(
            search_filter_bar,
            text="Pozycji: 17 / 17",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=THEME["cyan"]
        )
        self.lbl_positions_count.pack(side="right", padx=6)

        # 4. Tabela Dzieł (KARTY WIERSZY — 100% CZYTELNOŚĆ)
        table_container = ctk.CTkFrame(self.library_frame, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        table_container.pack(fill="both", expand=True)

        # 4.1 Nagłówek Tabeli (Header)
        self.header_frame = ctk.CTkFrame(table_container, fg_color="#101722", height=44, corner_radius=0)
        self.header_frame.pack(fill="x", padx=4, pady=(4, 2))
        self._build_table_header(self.header_frame)

        # 4.2 Scrollowalny obszar wierszy
        self.rows_scroll = ctk.CTkScrollableFrame(table_container, fg_color=THEME["bg_app"], corner_radius=8)
        self.rows_scroll.pack(fill="both", expand=True, padx=4, pady=4)

    def _build_table_header(self, parent):
        # Definicja kolumn: (nazwa, szerokość, anchor)
        parent.columnconfigure(0, weight=0, minsize=32)   # Checkbox
        parent.columnconfigure(1, weight=0, minsize=32)   # #
        parent.columnconfigure(2, weight=3, minsize=240)  # TYTUŁ / DZIEŁO
        parent.columnconfigure(3, weight=0, minsize=65)   # ROK
        parent.columnconfigure(4, weight=0, minsize=85)   # TYP
        parent.columnconfigure(5, weight=1, minsize=140)  # PLATFORMA / FORMAT
        parent.columnconfigure(6, weight=1, minsize=130)  # GATUNEK
        parent.columnconfigure(7, weight=0, minsize=75)   # OCENA
        parent.columnconfigure(8, weight=0, minsize=105)  # STATUS
        parent.columnconfigure(9, weight=0, minsize=75)   # CZAS (H)
        parent.columnconfigure(10, weight=0, minsize=90)  # DATA OCENY
        parent.columnconfigure(11, weight=0, minsize=80)  # USUŃ / EDYTUJ

        headers = [
            (0, "☐", "center"),
            (1, "#", "center"),
            (2, "TYTUŁ / DZIEŁO", "w"),
            (3, "ROK", "center"),
            (4, "TYP", "center"),
            (5, "PLATFORMA / FORMAT", "center"),
            (6, "GATUNEK", "w"),
            (7, "OCENA", "center"),
            (8, "STATUS", "center"),
            (9, "CZAS (H)", "center"),
            (10, "DATA OCENY", "center"),
            (11, "USUŃ / EDYTUJ", "center")
        ]

        for col_idx, text, anchor in headers:
            lbl = ctk.CTkLabel(
                parent,
                text=text,
                font=ctk.CTkFont(size=11, weight="bold"),
                text_color=THEME["cyan"],
                anchor=anchor
            )
            lbl.grid(row=0, column=col_idx, sticky="nsew", padx=6, pady=10)

    # -------------------------------------------------------------------------
    # 5.4 ODŚWIEŻANIE ZAKŁADEK ROCZNIKÓW
    # -------------------------------------------------------------------------
    def refresh_year_bookmarks(self):
        for w in self.years_buttons_frame.winfo_children():
            w.destroy()

        year_counts = self.db.get_distinct_years_with_counts()
        total_items = sum(year_counts.values())

        # Przycisk "Wszystkie lata"
        is_all_active = self.active_year == "Wszystkie lata"
        btn_all = ctk.CTkButton(
            self.years_buttons_frame,
            text=f"Wszystkie lata ({total_items})",
            height=30,
            fg_color="#21496b" if is_all_active else "#162232",
            hover_color="#2c5c87",
            text_color="#ffffff" if is_all_active else THEME["text_muted"],
            font=ctk.CTkFont(size=11, weight="bold" if is_all_active else "normal"),
            corner_radius=6,
            command=lambda: self._select_year("Wszystkie lata")
        )
        btn_all.pack(side="left", padx=3)

        # Posortowane roczniki malejąco
        sorted_years = sorted(year_counts.keys(), reverse=True)
        for yr in sorted_years:
            count = year_counts[yr]
            is_active = self.active_year == yr

            btn_yr = ctk.CTkButton(
                self.years_buttons_frame,
                text=f"{yr}  {count}",
                height=30,
                width=75,
                fg_color="#21496b" if is_active else "#162232",
                hover_color="#2c5c87",
                text_color="#ffffff" if is_active else THEME["text_muted"],
                font=ctk.CTkFont(size=11, weight="bold" if is_active else "normal"),
                corner_radius=6,
                command=lambda y=yr: self._select_year(y)
            )
            btn_yr.pack(side="left", padx=3)

    def _select_year(self, yr):
        self.active_year = yr
        self.refresh_year_bookmarks()
        self.refresh_library()

    def _on_search_key(self, event=None):
        if self._search_timer:
            self.after_cancel(self._search_timer)
        self._search_timer = self.after(200, self.refresh_library)

    # -------------------------------------------------------------------------
    # 5.5 ODŚWIEŻANIE TABELI (RENDEROWANIE KART WIERSZY)
    # -------------------------------------------------------------------------
    def refresh_library(self):
        # Czyszczenie wierszy
        for w in self.rows_scroll.winfo_children():
            w.destroy()

        search_q = self.entry_search.get()
        f_type = self.combo_ftype.get()
        f_status = self.combo_fstatus.get()

        all_items = self.db.get_items()
        filtered_items = self.db.get_items(
            search_query=search_q,
            item_type=f_type,
            status=f_status,
            year=self.active_year,
            sort_by="date_logged",
            sort_desc=True
        )

        self.lbl_positions_count.configure(text=f"Pozycji: {len(filtered_items)} / {len(all_items)}")
        self.lbl_badge.configure(text=f"v2.0 Gry • Książki • Ekrany  •  Baza: {len(all_items)} pozycji")

        if not filtered_items:
            empty_box = ctk.CTkFrame(self.rows_scroll, fg_color=THEME["bg_card"], corner_radius=10)
            empty_box.pack(fill="x", padx=10, pady=40)
            ctk.CTkLabel(
                empty_box,
                text="Brak pozycji spełniających podane kryteria filtrowania.\nKliknij '➕ Dodaj pozycję' w prawym górnym rogu lub zmień filtry.",
                font=ctk.CTkFont(size=13),
                text_color=THEME["text_muted"]
            ).pack(pady=30)
            return

        # Renderowanie każdego wiersza jako nowoczesnej, przestronnej karty
        for idx, item in enumerate(filtered_items, start=1):
            row_card = ctk.CTkFrame(
                self.rows_scroll,
                fg_color=THEME["bg_card"],
                corner_radius=8,
                border_width=1,
                border_color=THEME["border"],
                height=58
            )
            row_card.pack(fill="x", padx=4, pady=3)
            row_card.pack_propagate(False)

            # Identyczna konfiguracja kolumn jak w nagłówku
            row_card.columnconfigure(0, weight=0, minsize=32)
            row_card.columnconfigure(1, weight=0, minsize=32)
            row_card.columnconfigure(2, weight=3, minsize=240)
            row_card.columnconfigure(3, weight=0, minsize=65)
            row_card.columnconfigure(4, weight=0, minsize=85)
            row_card.columnconfigure(5, weight=1, minsize=140)
            row_card.columnconfigure(6, weight=1, minsize=130)
            row_card.columnconfigure(7, weight=0, minsize=75)
            row_card.columnconfigure(8, weight=0, minsize=105)
            row_card.columnconfigure(9, weight=0, minsize=75)
            row_card.columnconfigure(10, weight=0, minsize=90)
            row_card.columnconfigure(11, weight=0, minsize=80)

            # 0. Checkbox
            chk = ctk.CTkCheckBox(row_card, text="", width=20, corner_radius=4)
            chk.grid(row=0, column=0, sticky="nsew", padx=6)

            # 1. Numer #
            ctk.CTkLabel(
                row_card,
                text=str(idx),
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_muted"]
            ).grid(row=0, column=1, sticky="nsew", padx=4)

            # 2. Tytuł + Cytat recenzji
            title_box = ctk.CTkFrame(row_card, fg_color="transparent")
            title_box.grid(row=0, column=2, sticky="nsew", padx=8, pady=4)

            top_t_row = ctk.CTkFrame(title_box, fg_color="transparent")
            top_t_row.pack(anchor="w")

            lbl_title = ctk.CTkLabel(
                top_t_row,
                text=item["title"],
                font=ctk.CTkFont(size=13, weight="bold"),
                text_color=THEME["text_white"]
            )
            lbl_title.pack(side="left")

            if item.get("comment"):
                ctk.CTkLabel(
                    top_t_row,
                    text=" 📄",
                    font=ctk.CTkFont(size=10),
                    text_color=THEME["text_muted"]
                ).pack(side="left")

                # Cytat recenzji pod spodem
                quote_text = f'"{item["comment"][:55]}..."' if len(item["comment"]) > 55 else f'"{item["comment"]}"'
                ctk.CTkLabel(
                    title_box,
                    text=quote_text,
                    font=ctk.CTkFont(size=10, slant="italic"),
                    text_color=THEME["text_muted"]
                ).pack(anchor="w")

            # 3. Rok
            ctk.CTkLabel(
                row_card,
                text=str(item["year"] or "-"),
                font=ctk.CTkFont(size=12),
                text_color=THEME["text_light"]
            ).grid(row=0, column=3, sticky="nsew", padx=4)

            # 4. TYP Odznaka
            type_configs = {
                "Gra": ("🎮 Gra", THEME["badge_game_bg"], THEME["badge_game_fg"]),
                "Książka": ("📚 Książka", THEME["badge_book_bg"], THEME["badge_book_fg"]),
                "Film": ("🎬 Film", THEME["badge_movie_bg"], THEME["badge_movie_fg"]),
                "Serial": ("📺 Serial", THEME["badge_series_bg"], THEME["badge_series_fg"])
            }
            t_txt, t_bg, t_fg = type_configs.get(item["item_type"], ("🎮 Gra", THEME["badge_game_bg"], THEME["badge_game_fg"]))
            type_pill = ctk.CTkLabel(
                row_card,
                text=t_txt,
                font=ctk.CTkFont(size=11, weight="bold"),
                text_color=t_fg,
                fg_color=t_bg,
                corner_radius=6,
                padx=8,
                pady=2
            )
            type_pill.grid(row=0, column=4, padx=6)

            # 5. Platforma / Format Odznaka
            plat_pill = ctk.CTkLabel(
                row_card,
                text=item["platform"] or "-",
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_light"],
                fg_color="#182333",
                corner_radius=6,
                padx=8,
                pady=2
            )
            plat_pill.grid(row=0, column=5, padx=6)

            # 6. Gatunek
            ctk.CTkLabel(
                row_card,
                text=item["genre"] or "-",
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_light"],
                anchor="w"
            ).grid(row=0, column=6, sticky="w", padx=8)

            # 7. Ocena (Złota gwiazdka ⭐)
            ctk.CTkLabel(
                row_card,
                text=f"⭐ {item['rating']:.1f}" if item["rating"] else "-",
                font=ctk.CTkFont(size=12, weight="bold"),
                text_color=THEME["gold"]
            ).grid(row=0, column=7, sticky="nsew", padx=4)

            # 8. Status Odznaka
            status_configs = {
                "Ukończone": ("● Ukończone", THEME["status_done_bg"], THEME["status_done_fg"]),
                "W trakcie": ("● W trakcie", THEME["status_prog_bg"], THEME["status_prog_fg"]),
                "Planowane": ("● Planowane", THEME["status_plan_bg"], THEME["status_plan_fg"]),
                "Porzucone": ("● Porzucone", THEME["status_drop_bg"], THEME["status_drop_fg"]),
            }
            s_txt, s_bg, s_fg = status_configs.get(item["status"], ("● Ukończone", THEME["status_done_bg"], THEME["status_done_fg"]))
            stat_pill = ctk.CTkLabel(
                row_card,
                text=s_txt,
                font=ctk.CTkFont(size=11, weight="bold"),
                text_color=s_fg,
                fg_color=s_bg,
                corner_radius=12,
                padx=8,
                pady=2
            )
            stat_pill.grid(row=0, column=8, padx=6)

            # 9. Czas (H)
            ctk.CTkLabel(
                row_card,
                text=f"{item['hours_spent']:.1f} h" if item["hours_spent"] else "0.0 h",
                font=ctk.CTkFont(size=12, weight="bold"),
                text_color=THEME["cyan"]
            ).grid(row=0, column=9, sticky="nsew", padx=4)

            # 10. Data oceny
            ctk.CTkLabel(
                row_card,
                text=item["date_logged"] or "-",
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_muted"]
            ).grid(row=0, column=10, sticky="nsew", padx=4)

            # 11. Przyciski Edycji i Usuwania
            actions_box = ctk.CTkFrame(row_card, fg_color="transparent")
            actions_box.grid(row=0, column=11, padx=4)

            def make_edit(it_data=item):
                return lambda: self.open_edit_dialog(it_data)

            btn_edit = ctk.CTkButton(
                actions_box,
                text="✏️",
                width=28,
                height=28,
                fg_color="#1e2c3e",
                hover_color="#2b435e",
                corner_radius=6,
                command=make_edit()
            )
            btn_edit.pack(side="left", padx=2)

            def make_del(it_id=item["id"], it_title=item["title"]):
                return lambda: self.delete_single_item(it_id, it_title)

            btn_del = ctk.CTkButton(
                actions_box,
                text="🗑️",
                width=28,
                height=28,
                fg_color=THEME["red"],
                hover_color=THEME["red_hover"],
                corner_radius=6,
                command=make_del()
            )
            btn_del.pack(side="left", padx=2)

            # Podwójne kliknięcie na wiersz otwiera edycję
            row_card.bind("<Double-1>", lambda e, it=item: self.open_edit_dialog(it))
            lbl_title.bind("<Double-1>", lambda e, it=item: self.open_edit_dialog(it))

    # -------------------------------------------------------------------------
    # 5.6 ZAKŁADKA STATYSTYK & DZIEŁ ROKU
    # -------------------------------------------------------------------------
    def _build_stats_view(self):
        self.stats_scroll = ctk.CTkScrollableFrame(self.stats_frame, fg_color="transparent")
        self.stats_scroll.pack(fill="both", expand=True)

        # 1. Baner Sociale
        b_social = ctk.CTkFrame(self.stats_scroll, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        b_social.pack(fill="x", pady=(0, 12))

        b_left = ctk.CTkFrame(b_social, fg_color="transparent")
        b_left.pack(side="left", padx=16, pady=12)

        ctk.CTkLabel(
            b_left,
            text="📱 Podsumowanie • Eksport grafiki na Social Media",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="#ffffff"
        ).pack(anchor="w")

        ctk.CTkLabel(
            b_left,
            text="Wygeneruj plik graficzny (PNG) gotowy do wrzucenia na Instagram, Facebook, X ze swoimi Dziełami Roku i statystykami.",
            font=ctk.CTkFont(size=11),
            text_color=THEME["text_muted"]
        ).pack(anchor="w", pady=(2, 0))

        ctk.CTkButton(
            b_social,
            text="📱 Generuj grafikę (PNG)",
            fg_color=THEME["cyan"],
            hover_color="#45a4df",
            text_color="#0f1722",
            font=ctk.CTkFont(size=12, weight="bold"),
            height=34,
            command=self.export_social_graphic
        ).pack(side="right", padx=16, pady=12)

        # 2. Rząd 4 Kart Metryk
        metrics_row = ctk.CTkFrame(self.stats_scroll, fg_color="transparent")
        metrics_row.pack(fill="x", pady=(0, 12))
        for i in range(4):
            metrics_row.columnconfigure(i, weight=1)

        self.m_card_hours = self._create_metric_card(metrics_row, 0, "ŁĄCZNY CZAS", "0.0 h", "Gry, książki, filmy, seriale", THEME["cyan"])
        self.m_card_done = self._create_metric_card(metrics_row, 1, "UKOŃCZONE DZIEŁA", "0", "100% zrealizowane", "#4ade80")
        self.m_card_rate = self._create_metric_card(metrics_row, 2, "ŚREDNIA OCENA", "0.0 / 10", "Wszystkie dzieła", THEME["gold"])
        self.m_card_bg = self._create_metric_card(metrics_row, 3, "GRY VS KSIĄŻKI", "0h / 0h", "Podział czasu", "#c084fc")

        # 3. Sekcja DZIEŁA ROKU
        awards_box = ctk.CTkFrame(self.stats_scroll, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        awards_box.pack(fill="x", pady=(0, 12))

        aw_head = ctk.CTkFrame(awards_box, fg_color="transparent")
        aw_head.pack(fill="x", padx=16, pady=(12, 8))

        ctk.CTkLabel(
            aw_head,
            text="🏆 DZIEŁA ROKU (TOP WYBORY WG KATEGORII)",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=THEME["gold"]
        ).pack(side="left")

        self.combo_aw_year = ctk.CTkComboBox(
            aw_head,
            values=["2026", "2025", "2024", "2023", "Wszystkie"],
            width=110,
            height=32,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            command=lambda v: self._update_awards()
        )
        self.combo_aw_year.set("2026")
        self.combo_aw_year.pack(side="right")

        self.awards_grid = ctk.CTkFrame(awards_box, fg_color="transparent")
        self.awards_grid.pack(fill="x", padx=12, pady=(0, 14))
        for i in range(4):
            self.awards_grid.columnconfigure(i, weight=1)

        self.aw_labels = {}
        cats = [
            ("Gra", "🎮 GRA ROKU", THEME["cyan"]),
            ("Książka", "📚 KSIĄŻKA ROKU", THEME["gold"]),
            ("Film", "🎬 FILM ROKU", "#c084fc"),
            ("Serial", "📺 SERIAL ROKU", "#2dd4bf")
        ]
        for col_i, (cat, title, color) in enumerate(cats):
            card = ctk.CTkFrame(self.awards_grid, fg_color=THEME["bg_card"], corner_radius=8, border_width=1, border_color=THEME["border"])
            card.grid(row=0, column=col_i, padx=6, pady=4, sticky="nsew")

            ctk.CTkLabel(card, text=title, font=ctk.CTkFont(size=11, weight="bold"), text_color=color).pack(anchor="w", padx=12, pady=(10, 4))
            lbl_t = ctk.CTkLabel(card, text="Brak wpisu", font=ctk.CTkFont(size=13, weight="bold"), text_color="#ffffff", wraplength=200)
            lbl_t.pack(anchor="w", padx=12, pady=(0, 2))
            lbl_sub = ctk.CTkLabel(card, text="-", font=ctk.CTkFont(size=11), text_color=THEME["text_muted"])
            lbl_sub.pack(anchor="w", padx=12, pady=(0, 10))

            self.aw_labels[cat] = (lbl_t, lbl_sub)

        # 4. Wykresy Matplotlib
        charts_box = ctk.CTkFrame(self.stats_scroll, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        charts_box.pack(fill="x", pady=(0, 12))

        ctk.CTkLabel(
            charts_box,
            text="📊 PODZIAŁ CZASU I NAJCHĘTNIEJ EKSPLOROWANE GATUNKI",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=THEME["cyan"]
        ).pack(anchor="w", padx=16, pady=(12, 6))

        self.chart_container = ctk.CTkFrame(charts_box, fg_color="transparent")
        self.chart_container.pack(fill="both", expand=True, padx=12, pady=(0, 12))

    def _create_metric_card(self, parent, col, title, value, subtitle, color):
        card = ctk.CTkFrame(parent, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        card.grid(row=0, column=col, padx=4, pady=2, sticky="nsew")

        ctk.CTkLabel(card, text=title, font=ctk.CTkFont(size=10, weight="bold"), text_color=THEME["text_muted"]).pack(anchor="w", padx=14, pady=(10, 2))
        lbl_val = ctk.CTkLabel(card, text=value, font=ctk.CTkFont(size=20, weight="bold"), text_color=color)
        lbl_val.pack(anchor="w", padx=14, pady=(0, 2))
        ctk.CTkLabel(card, text=subtitle, font=ctk.CTkFont(size=10), text_color=THEME["text_muted"]).pack(anchor="w", padx=14, pady=(0, 10))
        return lbl_val

    def refresh_stats(self):
        stats = self.db.get_statistics()
        self.m_card_hours.configure(text=f"{stats['total_hours']:.1f} h")
        self.m_card_done.configure(text=f"{stats['completed_count']}")
        self.m_card_rate.configure(text=f"{stats['avg_rating']:.1f} / 10 ⭐")
        self.m_card_bg.configure(text=f"{stats['game_hours']:.0f}h / {stats['book_hours']:.0f}h")

        self._update_awards()
        self._render_charts(stats)

    def _update_awards(self):
        yr = self.combo_aw_year.get()
        awards = self.db.get_year_awards(yr)
        for cat, (lbl_t, lbl_sub) in self.aw_labels.items():
            item = awards.get(cat)
            if item:
                lbl_t.configure(text=item["title"])
                lbl_sub.configure(text=f"⭐ {item['rating']:.1f}  •  {item['hours_spent']:.1f}h  •  {item['platform']}")
            else:
                lbl_t.configure(text="Brak wpisu")
                lbl_sub.configure(text="-")

    def _render_charts(self, stats):
        for w in self.chart_container.winfo_children():
            w.destroy()

        fig = Figure(figsize=(10, 3.8), dpi=100, facecolor=THEME["bg_banner"])
        ax1 = fig.add_subplot(121)
        ax2 = fig.add_subplot(122)

        # Wykres 1: Platformy / Formaty
        p_data = stats["platform_hours"]
        if p_data:
            plats = [p[0][:16] for p in p_data]
            hours = [p[1] for p in p_data]
            ax1.barh(plats[::-1], hours[::-1], color="#3a82ba", edgecolor="#66c0f4", height=0.6)
            ax1.set_title("Godziny wg Platformy / Formatu", color="#ffffff", fontsize=11, fontweight="bold")
            ax1.tick_params(colors="#c7d5e0", labelsize=9)
            ax1.set_facecolor(THEME["bg_card"])
            ax1.spines["bottom"].set_color(THEME["border"])
            ax1.spines["top"].set_color("none")
            ax1.spines["right"].set_color("none")
            ax1.spines["left"].set_color(THEME["border"])
        else:
            ax1.text(0.5, 0.5, "Brak danych godzin", ha="center", va="center", color="#8f98a0")
            ax1.set_facecolor(THEME["bg_card"])

        # Wykres 2: Top Gatunki
        g_data = stats["genre_hours"]
        if g_data:
            gens = [g[0][:16] for g in g_data]
            ghours = [g[1] for g in g_data]
            ax2.barh(gens[::-1], ghours[::-1], color="#8a44b8", edgecolor="#c084fc", height=0.6)
            ax2.set_title("Najchętniej eksplorowane Gatunki", color="#ffffff", fontsize=11, fontweight="bold")
            ax2.tick_params(colors="#c7d5e0", labelsize=9)
            ax2.set_facecolor(THEME["bg_card"])
            ax2.spines["bottom"].set_color(THEME["border"])
            ax2.spines["top"].set_color("none")
            ax2.spines["right"].set_color("none")
            ax2.spines["left"].set_color(THEME["border"])
        else:
            ax2.text(0.5, 0.5, "Brak danych gatunków", ha="center", va="center", color="#8f98a0")
            ax2.set_facecolor(THEME["bg_card"])

        fig.tight_layout(pad=2.0)
        canvas = FigureCanvasTkAgg(fig, master=self.chart_container)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

    # -------------------------------------------------------------------------
    # 5.7 AKCJE (DODAWANIE, EDYCJA, USUWANIE, EKSPORT)
    # -------------------------------------------------------------------------
    def open_add_dialog(self):
        def on_save(data):
            self.db.add_item(data)
            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()
            messagebox.showinfo("Dodano", f"Pomyślnie dodano '{data['title']}' do bazy!", parent=self)

        MediaItemDialog(self, self.db, item_data=None, on_save_callback=on_save)

    def open_edit_dialog(self, item_data):
        def on_save(data):
            self.db.update_item(item_data["id"], data)
            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()
            messagebox.showinfo("Zapisano", f"Zaktualizowano dane '{data['title']}'!", parent=self)

        def on_del(del_id):
            self.db.delete_item(del_id)
            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()
            messagebox.showinfo("Usunięto", "Pomyślnie usunięto pozycję z bazy.", parent=self)

        MediaItemDialog(self, self.db, item_data=item_data, on_save_callback=on_save, on_delete_callback=on_del)

    def delete_single_item(self, item_id, title):
        confirm = messagebox.askyesno(
            "Potwierdzenie usunięcia",
            f"Czy na pewno chcesz bezpowrotnie usunąć z bazy danych:\n\n'{title}'?",
            parent=self
        )
        if confirm:
            self.db.delete_item(item_id)
            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()

    def open_options_manager(self):
        def on_upd():
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()
        OptionsManagerDialog(self, self.db, on_update_callback=on_upd)

    def reset_sample_data(self):
        if messagebox.askyesno("Reset do danych przykładowych", "Czy chcesz przywrócić 17 przykładowych pozycji z preview?", parent=self):
            self.db.reset_to_sample_data()
            self.active_year = "Wszystkie lata"
            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()
            messagebox.showinfo("Reset", "Baza została przywrócona do 17 przykładowych wpisów!", parent=self)

    def export_csv(self):
        items = self.db.get_items()
        if not items:
            messagebox.showwarning("Eksport", "Baza jest pusta!", parent=self)
            return

        path = filedialog.asksaveasfilename(
            parent=self,
            title="Eksportuj bibliotekę do CSV",
            defaultextension=".csv",
            filetypes=[("Pliki CSV", "*.csv"), ("Wszystkie pliki", "*.*")]
        )
        if not path:
            return

        try:
            with open(path, mode="w", newline="", encoding="utf-8-sig") as f:
                fieldnames = ["id", "title", "year", "item_type", "platform", "genre", "rating", "status", "hours_spent", "date_logged", "comment"]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for it in items:
                    writer.writerow(it)
            messagebox.showinfo("Sukces", f"Wyeksportowano {len(items)} pozycji do pliku:\n{path}", parent=self)
        except Exception as e:
            messagebox.showerror("Błąd", f"Nie udało się zapisać pliku: {e}", parent=self)

    def import_csv(self):
        path = filedialog.askopenfilename(
            parent=self,
            title="Wybierz plik CSV do zaimportowania",
            filetypes=[("Pliki CSV", "*.csv"), ("Wszystkie pliki", "*.*")]
        )
        if not path:
            return

        try:
            count = 0
            with open(path, mode="r", encoding="utf-8-sig") as f:
                content = f.read()

            if not content.strip():
                messagebox.showwarning("Pusty plik", "Wybrany plik CSV jest pusty!", parent=self)
                return

            first_line = content.splitlines()[0]
            semi_c = first_line.count(';')
            comma_c = first_line.count(',')
            tab_c = first_line.count('	')
            delim = ';' if semi_c > comma_c and semi_c > tab_c else ('	' if tab_c > comma_c else ',')

            import io, re
            f_io = io.StringIO(content)
            reader = csv.DictReader(f_io, delimiter=delim)

            field_map = {}
            for col in (reader.fieldnames or []):
                clean_col = col.lower().strip().replace('"', '').replace("'", "")
                norm_col = ''.join(c for c in clean_col if c.isalnum())
                field_map[col] = (clean_col, norm_col)

            def get_col_val(row_dict, aliases, fallback_subs=None):
                for orig_col, (clean_col, norm_col) in field_map.items():
                    for a in aliases:
                        if clean_col == a.lower():
                            return row_dict.get(orig_col, "")
                    for a in aliases:
                        norm_a = ''.join(c for c in a if c.isalnum()).lower()
                        if norm_col == norm_a:
                            return row_dict.get(orig_col, "")
                    if fallback_subs:
                        for s in fallback_subs:
                            if s in clean_col:
                                return row_dict.get(orig_col, "")
                return ""

            for r in reader:
                title = get_col_val(r, ["title", "tytuł", "tytul", "name", "nazwa", "dzieło", "dzielo"], ["tytu", "title"]).strip()
                if not title:
                    continue

                raw_type = get_col_val(r, ["item_type", "typ", "rodzaj", "type", "kategoria"], ["typ"]).strip().lower()
                if "książ" in raw_type or "ksiaz" in raw_type or "book" in raw_type:
                    itype = "Książka"
                elif "film" in raw_type or "movie" in raw_type:
                    itype = "Film"
                elif "serial" in raw_type or "series" in raw_type:
                    itype = "Serial"
                else:
                    itype = "Gra"

                raw_year = get_col_val(r, ["year", "rok", "premiera", "wydanie"], ["rok", "year"]).strip()
                yr = None
                year_match = re.search(r'\d{4}', raw_year)
                if year_match:
                    yr = int(year_match.group(0))

                raw_hours = get_col_val(r, [
                    "hours_spent", "hours", "godziny", "godzin", "godz", "czas",
                    "czas (h)", "czas [h]", "czash", "czas_h", "time", "timespent",
                    "time_spent", "hoursspent", "czas spędzony", "spędzony czas",
                    "czasspedzony", "czas trwania", "duration", "h"
                ], ["godz", "hour", "czas", "time"]).strip()

                hrs = 0.0
                if raw_hours:
                    if re.match(r'^\d{1,4}:\d{2}(:\d{2})?$', raw_hours):
                        parts = [int(p) for p in raw_hours.split(':')]
                        hrs = parts[0] + (parts[1] if len(parts) > 1 else 0) / 60.0
                    else:
                        num_m = re.search(r'-?\d+([.,]\d+)?', raw_hours)
                        if num_m:
                            try:
                                hrs = float(num_m.group(0).replace(',', '.'))
                            except ValueError:
                                hrs = 0.0

                raw_rating = get_col_val(r, ["rating", "ocena", "score", "punkty", "rate"], ["ocen", "rat"]).strip()
                rate = 8.0
                if raw_rating:
                    r_match = re.search(r'-?\d+([.,]\d+)?', raw_rating)
                    if r_match:
                        try:
                            parsed_r = float(r_match.group(0).replace(',', '.'))
                            rate = max(1.0, min(10.0, parsed_r))
                        except ValueError:
                            rate = 8.0

                raw_status = get_col_val(r, ["status", "stan", "postęp"], ["stat"]).strip()
                status = "Ukończone"
                if any(x in raw_status.lower() for x in ["w trakcie", "progress", "grane", "czytane"]):
                    status = "W trakcie"
                elif any(x in raw_status.lower() for x in ["porzuc", "drop"]):
                    status = "Porzucone"
                elif any(x in raw_status.lower() for x in ["plan", "chcę", "wish"]):
                    status = "Planowane"

                plat = get_col_val(r, ["platform", "platforma", "format", "czytnik", "konsola"], ["platf", "format"]).strip()
                if not plat:
                    plat = "Książka papierowa" if itype == "Książka" else "Inna"
                if plat == "Steam (PC)":
                    plat = "PC (Cyfrowa)"

                genre = get_col_val(r, ["genre", "gatunek", "kategoria_gatunku"], ["gatun", "genre"]).strip() or "Inny"
                date_l = get_col_val(r, ["date_logged", "data", "date", "ukonczono", "data_oceny"], ["dat"]).strip()
                if not date_l:
                    date_l = f"{yr}-06-01" if yr else datetime.today().strftime("%Y-%m-%d")
                comment = get_col_val(r, ["comment", "komentarz", "opinia", "recenzja", "notatka", "notes", "opis"], ["koment", "recenz", "notat"]).strip()

                self.db.add_item({
                    "title": title,
                    "year": yr,
                    "item_type": itype,
                    "platform": plat,
                    "genre": genre,
                    "rating": round(rate, 1),
                    "status": status,
                    "hours_spent": round(hrs, 1),
                    "date_logged": date_l,
                    "comment": comment
                })
                count += 1

            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()
            messagebox.showinfo("Sukces", f"Zaimportowano {count} pozycji z pliku CSV!", parent=self)
        except Exception as e:
            messagebox.showerror("Błąd", f"Błąd importu CSV: {e}", parent=self)

    def export_social_graphic(self):
        """Generuje elegancki plik graficzny (PNG) w formacie Instagram / Social Media."""
        stats = self.db.get_statistics()
        awards = self.db.get_year_awards(self.active_year if self.active_year != "Wszystkie lata" else "2026")

        path = filedialog.asksaveasfilename(
            parent=self,
            title="Zapisz grafikę na Social Media (PNG)",
            initialfile=f"ShelfMedia_Podsumowanie_{self.active_year}.png",
            defaultextension=".png",
            filetypes=[("Obraz PNG", "*.png")]
        )
        if not path:
            return

        try:
            fig = Figure(figsize=(8, 8), dpi=150, facecolor="#0f1722")
            ax = fig.add_subplot(111)
            ax.set_facecolor("#141d2b")
            ax.set_xlim(0, 10)
            ax.set_ylim(0, 10)
            ax.axis("off")

            # Nagłówek grafiki
            ax.text(5, 9.3, "SHELFMEDIA", color="#66c0f4", fontsize=16, fontweight="bold", ha="center")
            yr_label = self.active_year if self.active_year != "Wszystkie lata" else "CAŁOKSZTAŁT"
            ax.text(5, 8.8, f"PODSUMOWANIE ROKU • {yr_label}", color="#ffffff", fontsize=12, fontweight="bold", ha="center")

            # 4 Odznaki metryk
            metrics = [
                (2.0, 7.8, "CZAS", f"{stats['total_hours']:.0f} h", "#66c0f4"),
                (4.0, 7.8, "UKOŃCZONE", f"{stats['completed_count']}", "#4ade80"),
                (6.0, 7.8, "ŚREDNIA", f"{stats['avg_rating']:.1f} ★", "#f1c40f"),
                (8.0, 7.8, "POZYCJI", f"{stats['total_count']}", "#c084fc")
            ]
            for x, y, lab, val, col in metrics:
                ax.text(x, y + 0.3, lab, color="#8f98a0", fontsize=8, fontweight="bold", ha="center")
                ax.text(x, y - 0.1, val, color=col, fontsize=14, fontweight="bold", ha="center")

            # Linia podziału
            ax.plot([1, 9], [7.1, 7.1], color="#243547", linewidth=1.5)

            # Dzieła Roku
            ax.text(5, 6.6, "🏆 DZIEŁA ROKU", color="#f1c40f", fontsize=12, fontweight="bold", ha="center")

            aw_items = [
                ("🎮 GRA ROKU", awards.get("Gra"), 5.9, "#66c0f4"),
                ("📚 KSIĄŻKA ROKU", awards.get("Książka"), 4.9, "#f1c40f"),
                ("🎬 FILM ROKU", awards.get("Film"), 3.9, "#c084fc"),
                ("📺 SERIAL ROKU", awards.get("Serial"), 2.9, "#2dd4bf")
            ]
            for cat_title, it, y_pos, col in aw_items:
                ax.text(1.5, y_pos + 0.25, cat_title, color=col, fontsize=9, fontweight="bold", ha="left")
                if it:
                    ax.text(1.5, y_pos - 0.05, f"{it['title']} ({it['year'] or '-'})", color="#ffffff", fontsize=11, fontweight="bold", ha="left")
                    ax.text(1.5, y_pos - 0.35, f"Ocena: ⭐ {it['rating']:.1f}  •  Czas: {it['hours_spent']:.1f}h  •  {it['platform']}", color="#8f98a0", fontsize=8, ha="left")
                else:
                    ax.text(1.5, y_pos - 0.15, "Brak wpisu w tej kategorii", color="#8f98a0", fontsize=9, fontstyle="italic", ha="left")

            # Stopka
            ax.plot([1, 9], [2.1, 2.1], color="#243547", linewidth=1.5)
            ax.text(5, 1.4, "#ShelfMedia  •  Gry • Książki • Ekrany  •  100% Offline SQLite", color="#66c0f4", fontsize=9, ha="center")

            fig.savefig(path, facecolor=fig.get_facecolor(), edgecolor="none", bbox_inches="tight")
            messagebox.showinfo("Sukces", f"Pomyślnie wygenerowano grafikę na sociale:\n\n{path}", parent=self)
        except Exception as e:
            messagebox.showerror("Błąd", f"Nie udało się wygenerować grafiki: {e}", parent=self)

    def open_in_browser(self):
        """Uruchamia wbudowany lekki serwer HTTP z widokiem Web."""
        try:
            # Sprawdzenie czy istnieje katalog dist z plikiem index.html
            dist_path = os.path.join(os.path.dirname(__file__), "dist")
            if os.path.exists(os.path.join(dist_path, "index.html")):
                server_thread = threading.Thread(target=self._run_local_server, args=(dist_path,), daemon=True)
                server_thread.start()
                webbrowser.open("http://127.0.0.1:8765")
            else:
                messagebox.showinfo("Web UI", "Aplikacja desktopowa zawiera już kompletny interfejs identyczny z wersją Web!\nMożesz używać wszystkich funkcji bezpośrednio w tym oknie.", parent=self)
        except Exception as e:
            messagebox.showwarning("Przeglądarka", f"Nie można otworzyć przeglądarki: {e}", parent=self)

    def _run_local_server(self, root_dir):
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=root_dir, **kwargs)

            def log_message(self, format, *args):
                pass

        try:
            server = HTTPServer(("127.0.0.1", 8765), Handler)
            server.serve_forever()
        except Exception:
            pass


# =============================================================================
# 6. PUNKT STARTOWY APLIKACJI
# =============================================================================

def main():
    app = MediaTrackerApp()
    app.mainloop()

if __name__ == "__main__":
    main()

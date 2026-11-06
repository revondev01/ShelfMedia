export const PYTHON_SOURCE_CODE = `"""
=============================================================================
             SHELFMEDIA v2.4 (PYTHON DESKTOP EDITION)
=============================================================================
Kompletna aplikacja desktopowa w Pythonie ShelfMedia z Wirtualną Półką:
  - Przełącznik widoków: "Tabela" oraz "Wirtualna Półka" (CTkSegmentedButton)
  - Wirtualna Półka:
      * Poziome regały metalowe z neonowym podświetleniem LED
      * Pionowe kolorowe grzbiety ze zróżnicowanymi gabarytami:
          - Gra: Fioletowy / Niebieski (#1e2a5e / #2e4bb8)
          - Książka: Brązowy / Pomarańczowy (#4a2206 / #b34709)
          - Film: Fiolet / Róż (#4a093e / #a81b7a)
          - Serial: Zielony (#093d25 / #13804d)
      * Tytuł dzieła oraz ocena (np. Wiedźmin 3 ★9.8) na grzbiecie
      * Kliknięcie grzbietu otwiera CTkToplevel ze szczegółami i akcjami Edytuj / Usuń
  - 100% offline, lokalna baza SQLite (media_tracker.db)
  - Zakładki roczników, filtry, eksport/import CSV, wykresy i statystyki
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
    print("\\n[BŁĄD] Moduł 'tkinter' nie jest zainstalowany w Twoim środowisku Pythona!")
    print("Na systemach Linux (Ubuntu/Debian) zainstaluj go poleceniem:")
    print("    sudo apt install python3-tk\\n")
    sys.exit(1)

# Weryfikacja CustomTkinter
try:
    import customtkinter as ctk
except ImportError:
    print("\\n[BŁĄD] Biblioteka 'customtkinter' nie jest zainstalowana!")
    print("Zainstaluj wymagane pakiety wpisując w terminalu:")
    print("    pip install customtkinter matplotlib\\n")
    sys.exit(1)

# Weryfikacja Matplotlib
try:
    import matplotlib
    matplotlib.use("TkAgg")
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    from matplotlib.figure import Figure
except ImportError:
    print("\\n[BŁĄD] Biblioteka 'matplotlib' nie jest zainstalowana!")
    print("Zainstaluj wymagane pakiety wpisując w terminalu:")
    print("    pip install customtkinter matplotlib\\n")
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
    "Akcja / Otwarty Świat",
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
    (1, "Grand Theft Auto VI", 2026, "Gra", "PlayStation 5", "Akcja / Otwarty Świat", 9.5, "W trakcie", 45.0, 0, "2026-10-05", "Vice City wygląda oszałamiająco. Niesamowity poziom detali i fizyki świata."),
    (2, "The Blood of Dawnwalker", 2026, "Gra", "PC (Cyfrowa)", "RPG akcji", 8.0, "Ukończone", 42.0, 0, "2026-10-04", "Świetna mroczna oprawa, wymagający system walki i gęsty klimat dark fantasy."),
    (3, "Projekt Hail Mary (Andy Weir)", 2021, "Książka", "Audiobook / Storytel", "Sci-Fi", 10.0, "Ukończone", 18.5, 496, "2026-03-14", "Absolutne arcydzieło science-fiction, fantastyczny lektor i wzruszająca przyjaźń z Rockym."),
    (4, "Wiedźmin: Ostatnie Życzenie", 1993, "Książka", "Książka papierowa", "Fantasy", 9.0, "Ukończone", 0.0, 288, "2026-02-10", "Znakomity powrót do opowiadań o Geralcie z Rivii. Humor, sarkazm i słowiański folklor."),
    (5, "Diuna: Proroctwo", 2026, "Serial", "Max (HBO)", "Sci-Fi", 9.0, "Ukończone", 8.0, 0, "2026-03-10", "Fascynująca geneza zakonu Bene Gesserit w uniwersum Franka Herberta."),
    (6, "Wiedźmin 3: Dziki Gon", 2015, "Gra", "PC (Cyfrowa)", "RPG", 10.0, "Ukończone", 145.5, 0, "2024-01-15", "Jedna z najlepszych gier wszech czasów. Dodatki Krew i Wino to absolutne mistrzostwo narracyjne."),
    (7, "Cyberpunk 2077: Phantom Liberty", 2023, "Gra", "PC (Cyfrowa)", "RPG / Sci-Fi", 9.5, "Ukończone", 86.0, 0, "2024-03-20", "Po patchu 2.0 i z dodatkiem gra wreszcie spełniła wszystkie obietnice. Dogtown ma genialny klimat."),
    (8, "Diuna: Część Druga", 2024, "Film", "Kino / IMAX", "Sci-Fi", 9.0, "Ukończone", 2.8, 0, "2024-03-05", "Niesamowita oprawa audiowizualna Hansa Zimmera i Villeneuva. Prawdziwe widowisko kinowe."),
    (9, "Problem trzech ciał (Cixin Liu)", 2008, "Książka", "Kindle / E-book", "Sci-Fi", 9.5, "Ukończone", 16.0, 448, "2024-06-12", "Genialna koncepcja kontaktu z obcą cywilizacją, fizyki kwantowej i paradoksu Fermiego."),
    (10, "Szogun (Shōgun)", 2024, "Serial", "Disney+", "Dramat / Historyczny", 9.0, "Ukończone", 10.0, 0, "2024-04-25", "Świetna adaptacja powieści Jamesa Clavella, doskonała gra aktorska Hiroyukiego Sanady."),
    (11, "Elden Ring: Shadow of the Erdtree", 2024, "Gra", "PC (Cyfrowa)", "Soulslike", 9.5, "Ukończone", 54.0, 0, "2024-07-02", "Jeden z najlepszych dodatków w historii gier wideo. Wymagający, piękny i tajemniczy."),
    (12, "Fallout", 2024, "Serial", "Prime Video", "Post-apo", 8.0, "Ukończone", 8.0, 0, "2024-05-01", "Świetny retrofuturyzm, czarny humor i idealne oddanie estetyki uniwersum Fallouta."),
    (13, "Diuna (Frank Herbert)", 1965, "Książka", "Kindle / E-book", "Sci-Fi", 9.5, "Ukończone", 26.0, 680, "2025-04-18", "Niezrównany świat Arrakis, intrygi polityczne Bene Gesserit i mistycyzm pustyni."),
    (14, "Oppenheimer", 2023, "Film", "Kino / IMAX", "Biograficzny", 8.5, "Ukończone", 3.0, 0, "2023-11-12", "Świetne tempo i montaż dźwięku w filmie Christophera Nolana. Cillian Murphy w życiowej roli."),
    (15, "The Last of Us", 2023, "Serial", "Max (HBO)", "Post-apo", 8.5, "Ukończone", 9.0, 0, "2023-03-14", "Bardzo wierna i emocjonująca adaptacja gry Naughty Dog od twórców Czarnobyla."),
    (16, "Hollow Knight", 2017, "Gra", "Nintendo Switch", "Metroidvania", 9.5, "Ukończone", 42.0, 0, "2023-08-19", "Cudowny klimat, muzyka i wysoki poziom wyzwania. Czekamy na Silksong!"),
    (17, "Starfield", 2023, "Gra", "PC (Cyfrowa)", "RPG", 6.0, "Porzucone", 18.5, 0, "2023-09-28", "Zbyt dużo powtarzalnych planet i ekranów ładowania. Fabuła nie wciągnęła na dłużej.")
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
                    pages INTEGER DEFAULT 0,
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
            # Migracja kolumny pages jeśli baza istniała wcześniej
            cursor.execute("PRAGMA table_info(media_items)")
            cols = [row[1] for row in cursor.fetchall()]
            if "pages" not in cols:
                try:
                    cursor.execute("ALTER TABLE media_items ADD COLUMN pages INTEGER DEFAULT 0")
                except Exception:
                    pass
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
                    INSERT INTO media_items (id, title, year, item_type, platform, genre, rating, status, hours_spent, pages, date_logged, comment)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, SAMPLE_MEDIA_ITEMS)
                conn.commit()

    def reset_to_sample_data(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM media_items")
            cursor.executemany("""
                INSERT INTO media_items (id, title, year, item_type, platform, genre, rating, status, hours_spent, pages, date_logged, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, SAMPLE_MEDIA_ITEMS)
            conn.commit()

    def add_item(self, data):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO media_items (title, year, item_type, platform, genre, rating, status, hours_spent, pages, date_logged, comment)
                VALUES (:title, :year, :item_type, :platform, :genre, :rating, :status, :hours_spent, :pages, :date_logged, :comment)
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
                    pages = :pages,
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
                "pages": "pages",
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
                    COALESCE(SUM(pages), 0) as total_pages,
                    COALESCE(AVG(rating), 0) as avg_rating,
                    COALESCE(SUM(CASE WHEN status = 'Ukończone' THEN 1 ELSE 0 END), 0) as completed_count,
                    COALESCE(SUM(CASE WHEN status = 'W trakcie' THEN 1 ELSE 0 END), 0) as in_progress_count,
                    COALESCE(SUM(CASE WHEN item_type = 'Gra' THEN hours_spent ELSE 0 END), 0) as game_hours,
                    COALESCE(SUM(CASE WHEN item_type LIKE '%Książk%' OR item_type LIKE '%Ksiazk%' THEN hours_spent ELSE 0 END), 0) as book_hours,
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
                "total_pages": summary_row["total_pages"] or 0,
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
                cat_match = cat
                if year == "Wszystkie":
                    cursor.execute("""
                        SELECT * FROM media_items
                        WHERE (item_type = ? OR (item_type LIKE '%Książk%' AND ? = 'Książka'))
                        ORDER BY rating DESC, hours_spent DESC, id DESC
                        LIMIT 1
                    """, (cat, cat))
                else:
                    cursor.execute("""
                        SELECT * FROM media_items
                        WHERE (item_type = ? OR (item_type LIKE '%Książk%' AND ? = 'Książka'))
                          AND (SUBSTR(date_logged, 1, 4) = ? OR CAST(year AS TEXT) = ?)
                        ORDER BY rating DESC, hours_spent DESC, id DESC
                        LIMIT 1
                    """, (cat, cat, year, year))
                row = cursor.fetchone()
                awards[cat] = dict(row) if row else None

            return awards


# =============================================================================
# 2. DESIGN & KOLORYSTYKA
# =============================================================================

THEME = {
    "bg_app": "#0f1722",
    "bg_header": "#171a21",
    "bg_banner": "#141d2b",
    "bg_card": "#151f2e",
    "bg_card_hover": "#1c2a3e",
    "bg_input": "#101722",
    "border": "#243547",
    "border_cyan": "#2b567a",
    "text_white": "#ffffff",
    "text_light": "#c7d5e0",
    "text_muted": "#8f98a0",
    "cyan": "#66c0f4",
    "green": "#5c7e10",
    "green_hover": "#79a313",
    "red": "#782222",
    "red_hover": "#a82b2b",
    "gold": "#f1c40f",
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

DEFAULT_TYPE_STYLES = {
    "gra": {"name": "Gra", "color": "#66c0f4", "bg": "#142d47", "icon": "🎮", "spine_bg": "#1e2954", "accent": "#93c5fd", "h": 210, "w": 78},
    "książka": {"name": "Książka", "color": "#f59e0b", "bg": "#38240d", "icon": "📖", "spine_bg": "#4a2206", "accent": "#fed7aa", "h": 230, "w": 84},
    "film": {"name": "Film", "color": "#d946ef", "bg": "#2c1742", "icon": "🎬", "spine_bg": "#4a093e", "accent": "#fbcfe8", "h": 195, "w": 74},
    "serial": {"name": "Serial", "color": "#2dd4bf", "bg": "#123028", "icon": "📺", "spine_bg": "#093d25", "accent": "#a7f3d0", "h": 215, "w": 78},
    "komiks": {"name": "Komiks", "color": "#facc15", "bg": "#382f0d", "icon": "📚", "spine_bg": "#4a3b06", "accent": "#fde047", "h": 225, "w": 82},
    "anime": {"name": "Anime", "color": "#a855f7", "bg": "#291838", "icon": "✨", "spine_bg": "#361b4d", "accent": "#e9d5ff", "h": 210, "w": 76},
    "manga": {"name": "Manga", "color": "#f43f5e", "bg": "#381520", "icon": "📑", "spine_bg": "#52162a", "accent": "#fecdd3", "h": 225, "w": 80},
    "podcast": {"name": "Podcast", "color": "#06b6d4", "bg": "#0f2f38", "icon": "🎙️", "spine_bg": "#133f4d", "accent": "#bae6fd", "h": 205, "w": 76},
    "planszówka": {"name": "Planszówka", "color": "#14b8a6", "bg": "#10332e", "icon": "🎲", "spine_bg": "#134a42", "accent": "#99f6e4", "h": 220, "w": 80},
    "dokument": {"name": "Dokument", "color": "#94a3b8", "bg": "#1e2633", "icon": "📄", "spine_bg": "#283344", "accent": "#cbd5e1", "h": 205, "w": 74},
}

def get_type_style(itype: str) -> dict:
    t = (itype or "").strip().lower()
    if t in DEFAULT_TYPE_STYLES:
        return DEFAULT_TYPE_STYLES[t]
    if "książ" in t or "ksiaz" in t:
        return DEFAULT_TYPE_STYLES["książka"]
    if "gra" in t:
        return DEFAULT_TYPE_STYLES["gra"]
    if "film" in t:
        return DEFAULT_TYPE_STYLES["film"]
    if "serial" in t:
        return DEFAULT_TYPE_STYLES["serial"]
    if "komiks" in t:
        return DEFAULT_TYPE_STYLES["komiks"]
    if "manga" in t:
        return DEFAULT_TYPE_STYLES["manga"]
    if "anime" in t:
        return DEFAULT_TYPE_STYLES["anime"]
    if "podcast" in t:
        return DEFAULT_TYPE_STYLES["podcast"]
    if "plansz" in t:
        return DEFAULT_TYPE_STYLES["planszówka"]
    if "dokument" in t:
        return DEFAULT_TYPE_STYLES["dokument"]
    return {
        "name": itype,
        "color": "#a855f7",
        "bg": "#282038",
        "icon": "🏷️",
        "spine_bg": "#2a1c40",
        "accent": "#d8b4fe",
        "h": 210,
        "w": 76
    }


# =============================================================================
# 3. MODAL SZCZEGÓŁÓW POZYCJI (OTWIERANY Z WIRTUALNEJ PÓŁKI)
# =============================================================================

class ItemDetailsDialog(ctk.CTkToplevel):
    """Wyskakujące okienko ze szczegółami dzieła po kliknięciu w grzbiet na półce."""

    def __init__(self, parent, db: DatabaseManager, item_data, on_edit_callback=None, on_delete_callback=None):
        super().__init__(parent)
        self.db = db
        self.item_data = item_data
        self.on_edit_callback = on_edit_callback
        self.on_delete_callback = on_delete_callback

        self.title(f"Szczegóły dzieła: {item_data.get('title', '')}")
        self.geometry("540x640")
        self.configure(fg_color=THEME["bg_banner"])
        self.transient(parent)
        self.grab_set()

        itype = item_data.get("item_type", "Gra")
        t_low = itype.lower()

        # Kolorystyka nagłówka według kategorii
        if t_low == "gra":
            top_bg = "#1e2954"
            cat_icon = "🎮"
        elif "książ" in t_low or "ksiaz" in t_low:
            top_bg = "#4a2206"
            cat_icon = "📖"
        elif t_low == "film":
            top_bg = "#4a093e"
            cat_icon = "🎬"
        elif t_low == "serial":
            top_bg = "#093d25"
            cat_icon = "📺"
        else:
            top_bg = "#152438"
            cat_icon = "🏷️"

        # Nagłówek
        header = ctk.CTkFrame(self, fg_color=top_bg, height=85, corner_radius=0)
        header.pack(fill="x")

        ctk.CTkLabel(
            header,
            text=f"{cat_icon}  {item_data.get('title', '')}",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color="#ffffff",
            wraplength=480,
            justify="left"
        ).pack(anchor="w", padx=20, pady=(14, 2))

        sub_info = f"{itype}  •  {item_data.get('platform', '')}  •  {item_data.get('genre', '')}"
        if item_data.get("year"):
            sub_info += f"  •  Rok: {item_data['year']}"

        ctk.CTkLabel(
            header,
            text=sub_info,
            font=ctk.CTkFont(size=11),
            text_color=THEME["cyan"]
        ).pack(anchor="w", padx=20, pady=(0, 12))

        # Ciało okna
        body = ctk.CTkScrollableFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=12)

        # 3 kolumny metryk: Ocena, Status, Czas/Strony
        metrics_box = ctk.CTkFrame(body, fg_color=THEME["bg_card"], corner_radius=8, border_width=1, border_color=THEME["border"])
        metrics_box.pack(fill="x", pady=(0, 12))
        metrics_box.columnconfigure(0, weight=1)
        metrics_box.columnconfigure(1, weight=1)
        metrics_box.columnconfigure(2, weight=1)

        # Ocena
        m1 = ctk.CTkFrame(metrics_box, fg_color="transparent")
        m1.grid(row=0, column=0, padx=6, pady=12)
        ctk.CTkLabel(m1, text="OCENA", font=ctk.CTkFont(size=10, weight="bold"), text_color=THEME["text_muted"]).pack()
        ctk.CTkLabel(m1, text=f"★ {item_data.get('rating', 0):.1f} / 10", font=ctk.CTkFont(size=15, weight="bold"), text_color=THEME["gold"]).pack(pady=(2, 0))

        # Status
        m2 = ctk.CTkFrame(metrics_box, fg_color="transparent")
        m2.grid(row=0, column=1, padx=6, pady=12)
        ctk.CTkLabel(m2, text="STATUS", font=ctk.CTkFont(size=10, weight="bold"), text_color=THEME["text_muted"]).pack()
        ctk.CTkLabel(m2, text=item_data.get("status", "Ukończone"), font=ctk.CTkFont(size=13, weight="bold"), text_color=THEME["cyan"]).pack(pady=(2, 0))

        # Czas / Strony
        m3 = ctk.CTkFrame(metrics_box, fg_color="transparent")
        m3.grid(row=0, column=2, padx=6, pady=12)
        ctk.CTkLabel(m3, text="CZAS / STRONY", font=ctk.CTkFont(size=10, weight="bold"), text_color=THEME["text_muted"]).pack()
        h_val = item_data.get("hours_spent", 0)
        p_val = item_data.get("pages")
        t_label = ""
        if h_val:
            t_label = f"{h_val:.1f} h"
        if p_val:
            t_label += f" ({p_val} str.)" if t_label else f"{p_val} str."
        if not t_label:
            t_label = "opcjonalny"
        ctk.CTkLabel(m3, text=t_label, font=ctk.CTkFont(size=13, weight="bold"), text_color="#ffffff").pack(pady=(2, 0))

        # Data ukończenia
        d_box = ctk.CTkFrame(body, fg_color=THEME["bg_card"], corner_radius=8, border_width=1, border_color=THEME["border"])
        d_box.pack(fill="x", pady=(0, 12))
        ctk.CTkLabel(
            d_box,
            text=f"📅 Data zarejestrowania: {item_data.get('date_logged', '-')}",
            font=ctk.CTkFont(size=12),
            text_color=THEME["text_light"]
        ).pack(anchor="w", padx=14, pady=10)

        # Komentarz / Własna recenzja
        c_box = ctk.CTkFrame(body, fg_color=THEME["bg_card"], corner_radius=8, border_width=1, border_color=THEME["border"])
        c_box.pack(fill="x", pady=(0, 12))
        ctk.CTkLabel(
            c_box,
            text="💬 NOTATKA / WŁASNA RECENZJA:",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=THEME["cyan"]
        ).pack(anchor="w", padx=14, pady=(10, 4))

        comm = item_data.get("comment", "")
        if comm:
            ctk.CTkLabel(
                c_box,
                text=f'"{comm}"',
                font=ctk.CTkFont(size=12, slant="italic"),
                text_color="#ffffff",
                wraplength=460,
                justify="left"
            ).pack(anchor="w", padx=14, pady=(0, 12))
        else:
            ctk.CTkLabel(
                c_box,
                text="Brak notatki ani recenzji.",
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_muted"]
            ).pack(anchor="w", padx=14, pady=(0, 12))

        # Stopka z akcjami
        footer = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=60, corner_radius=0)
        footer.pack(fill="x", side="bottom")

        def del_action():
            self.destroy()
            if self.on_delete_callback:
                self.on_delete_callback(self.item_data["id"], self.item_data.get("title", ""))

        def edit_action():
            self.destroy()
            if self.on_edit_callback:
                self.on_edit_callback(self.item_data)

        ctk.CTkButton(
            footer,
            text="🗑️ Usuń z bazy",
            width=120,
            height=36,
            fg_color=THEME["red"],
            hover_color=THEME["red_hover"],
            font=ctk.CTkFont(size=12, weight="bold"),
            command=del_action
        ).pack(side="left", padx=16, pady=12)

        ctk.CTkButton(
            footer,
            text="Zamknij",
            width=90,
            height=36,
            fg_color="#212b3b",
            hover_color="#2a475e",
            command=self.destroy
        ).pack(side="right", padx=(6, 16), pady=12)

        ctk.CTkButton(
            footer,
            text="✏️ Edytuj dzieło",
            width=120,
            height=36,
            fg_color=THEME["cyan"],
            hover_color="#52aee0",
            text_color="#0f1722",
            font=ctk.CTkFont(size=12, weight="bold"),
            command=edit_action
        ).pack(side="right", padx=6, pady=12)


# =============================================================================
# 4. MODAL DODAWANIA / EDYCJI POZYCJI
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
        self.combo_type = ctk.CTkComboBox(b_type, values=["Gra", "Książka", "Film", "Serial", "Komiks", "Anime", "Manga", "Podcast"], height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
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
        self.combo_genre.set(genres[0] if genres else "Akcja / Otwarty Świat")
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

        # 5. Czas i Strony
        row4 = ctk.CTkFrame(body, fg_color="transparent")
        row4.pack(fill="x", pady=(0, 12))
        row4.columnconfigure(0, weight=1)
        row4.columnconfigure(1, weight=1)

        b_time = ctk.CTkFrame(row4, fg_color="transparent")
        b_time.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        ctk.CTkLabel(b_time, text="CZAS (H) - OPCJONALNY", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        self.entry_hours = ctk.CTkEntry(b_time, placeholder_text="np. 45.0 (lub puste)", height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_hours.pack(fill="x")

        b_pages = ctk.CTkFrame(row4, fg_color="transparent")
        b_pages.grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        ctk.CTkLabel(b_pages, text="LICZBA STRON (KSIĄŻKI)", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(0, 2))
        self.entry_pages = ctk.CTkEntry(b_pages, placeholder_text="np. 496", height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_pages.pack(fill="x")

        # 6. Data ukończenia
        ctk.CTkLabel(body, text="DATA ZAREJESTROWANIA (RRRR-MM-DD)", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["text_light"]).pack(anchor="w", pady=(4, 2))
        today_s = datetime.today().strftime("%Y-%m-%d")
        self.entry_date = ctk.CTkEntry(body, placeholder_text=today_s, height=38, fg_color=THEME["bg_input"], border_color=THEME["border"])
        self.entry_date.insert(0, today_s)
        self.entry_date.pack(fill="x", pady=(0, 12))

        # 7. Komentarz
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
            self.combo_genre.set(self.item_data.get("genre", "Akcja / Otwarty Świat"))
            self.combo_status.set(self.item_data.get("status", "Ukończone"))

            r_val = float(self.item_data.get("rating", 8.0))
            self.slider_rate.set(r_val)
            self.lbl_rate_val.configure(text=f"{r_val:.1f} ★")

            h_val = self.item_data.get("hours_spent", 0)
            self.entry_hours.insert(0, str(h_val) if h_val else "")

            p_val = self.item_data.get("pages")
            if p_val:
                self.entry_pages.insert(0, str(p_val))

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
        if messagebox.askyesno("Potwierdzenie usunięcia", f"Czy na pewno chcesz bezpowrotnie usunąć z bazy:\\n\\n'{title}'?", parent=self):
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

        pages_str = self.entry_pages.get().strip()
        pages = 0
        if pages_str:
            try:
                pages = int(pages_str)
            except ValueError:
                pages = 0

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
            "pages": pages,
            "date_logged": date_str,
            "comment": self.text_comment.get("1.0", tk.END).strip()
        }

        if self.on_save_callback:
            self.on_save_callback(data)

        self.destroy()


# =============================================================================
# 5. GŁÓWNA APLIKACJA — SHELFMEDIA Z PRZEŁĄCZNIKIEM WIDOKÓW
# =============================================================================

class MediaTrackerApp(ctk.CTk):
    """Główne okno aplikacji ShelfMedia z widokiem Tabeli i Wirtualnej Półki."""

    def __init__(self):
        super().__init__()

        self.db = DatabaseManager("media_tracker.db")

        self.title("SHELFMEDIA — Twoja półka na media (Wirtualna Półka)")
        self.geometry("1280x840")
        self.minsize(1080, 680)

        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        self.configure(fg_color=THEME["bg_app"])

        # Stan filtrów i widoku
        self.active_year = "Wszystkie lata"
        self.active_tab = "library"
        self.view_mode = "table"  # "table" lub "shelf"
        self.selected_ids = set()
        self._search_timer = None

        self._build_top_navbar()
        self._build_main_content()
        self.refresh_year_bookmarks()
        self.refresh_library()

    def _build_top_navbar(self):
        nav = ctk.CTkFrame(self, fg_color=THEME["bg_header"], height=64, corner_radius=0)
        nav.pack(fill="x", side="top")

        # Lewo: Logo ShelfMedia
        brand = ctk.CTkFrame(nav, fg_color="transparent")
        brand.pack(side="left", padx=16, pady=10)

        icon_box = ctk.CTkFrame(brand, fg_color="#183654", width=38, height=38, corner_radius=8)
        icon_box.pack(side="left", padx=(0, 10))
        icon_box.pack_propagate(False)
        ctk.CTkLabel(icon_box, text="📚", font=ctk.CTkFont(size=18)).pack(expand=True)

        text_box = ctk.CTkFrame(brand, fg_color="transparent")
        text_box.pack(side="left")

        ctk.CTkLabel(text_box, text="SHELFMEDIA", font=ctk.CTkFont(size=15, weight="bold"), text_color="#ffffff").pack(anchor="w")
        ctk.CTkLabel(text_box, text="Twoja półka na media", font=ctk.CTkFont(size=10), text_color=THEME["text_muted"]).pack(anchor="w")

        # Środek: Zakładki Biblioteka / Statystyki
        tabs_box = ctk.CTkFrame(nav, fg_color="transparent")
        tabs_box.pack(side="left", padx=(30, 0))

        self.btn_tab_lib = ctk.CTkButton(
            tabs_box,
            text="📚 Biblioteka",
            width=120,
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

        # Prawo: Przyciski akcji
        actions = ctk.CTkFrame(nav, fg_color="transparent")
        actions.pack(side="right", padx=16, pady=10)

        ctk.CTkButton(
            actions,
            text="➕ Dodaj pozycję",
            width=125,
            height=36,
            fg_color=THEME["green"],
            hover_color=THEME["green_hover"],
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self.open_add_dialog
        ).pack(side="right", padx=(6, 0))

        ctk.CTkButton(
            actions,
            text="⬇ Eksport CSV",
            width=105,
            height=36,
            fg_color="#1a2433",
            hover_color="#233247",
            text_color=THEME["text_light"],
            font=ctk.CTkFont(size=11),
            command=self.export_csv
        ).pack(side="right", padx=(6, 0))

        ctk.CTkButton(
            actions,
            text="⬆ Import CSV",
            width=100,
            height=36,
            fg_color="#1a2433",
            hover_color="#233247",
            text_color=THEME["text_light"],
            font=ctk.CTkFont(size=11),
            command=self.import_csv
        ).pack(side="right", padx=(6, 0))

    def _build_main_content(self):
        self.content_container = ctk.CTkFrame(self, fg_color="transparent")
        self.content_container.pack(fill="both", expand=True, padx=20, pady=12)

        self.library_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.library_frame.pack(fill="both", expand=True)

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

    def _build_library_view(self):
        # 1. Zakładki Roczników
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

        # 2. Pasek Wyszukiwania, Filtrów i PRZEŁĄCZNIKA WIDOKÓW
        search_filter_bar = ctk.CTkFrame(self.library_frame, fg_color="transparent")
        search_filter_bar.pack(fill="x", pady=(0, 10))

        self.entry_search = ctk.CTkEntry(
            search_filter_bar,
            placeholder_text="🔍 Szukaj dzieła, autora, gatunku, platformy...",
            height=40,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            font=ctk.CTkFont(size=12)
        )
        self.entry_search.pack(side="left", fill="x", expand=True, padx=(0, 10))
        self.entry_search.bind("<KeyRelease>", self._on_search_key)

        lbl_ft = ctk.CTkLabel(search_filter_bar, text="Typ:", text_color=THEME["text_muted"], font=ctk.CTkFont(size=12, weight="bold"))
        lbl_ft.pack(side="left", padx=(0, 4))
        self.combo_ftype = ctk.CTkComboBox(
            search_filter_bar,
            values=["Wszystkie media", "Gra", "Książka", "Film", "Serial", "Komiks"],
            height=40,
            width=135,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            command=lambda v: self.refresh_library()
        )
        self.combo_ftype.set("Wszystkie media")
        self.combo_ftype.pack(side="left", padx=(0, 10))

        lbl_fs = ctk.CTkLabel(search_filter_bar, text="Status:", text_color=THEME["text_muted"], font=ctk.CTkFont(size=12, weight="bold"))
        lbl_fs.pack(side="left", padx=(0, 4))
        self.combo_fstatus = ctk.CTkComboBox(
            search_filter_bar,
            values=["Wszystkie statusy", "Ukończone", "W trakcie", "Planowane", "Porzucone"],
            height=40,
            width=140,
            fg_color=THEME["bg_input"],
            border_color=THEME["border"],
            command=lambda v: self.refresh_library()
        )
        self.combo_fstatus.set("Wszystkie statusy")
        self.combo_fstatus.pack(side="left", padx=(0, 12))

        # PRZEŁĄCZNIK WIDOKÓW: TABELA / WIRTUALNA PÓŁKA
        self.seg_view_mode = ctk.CTkSegmentedButton(
            search_filter_bar,
            values=["📋 Tabela", "📚 Wirtualna Półka"],
            height=38,
            selected_color=THEME["cyan"],
            selected_hover_color="#52aee0",
            text_color="#ffffff",
            command=self._on_view_mode_change
        )
        self.seg_view_mode.set("📋 Tabela")
        self.seg_view_mode.pack(side="right", padx=(6, 0))

        self.lbl_positions_count = ctk.CTkLabel(
            search_filter_bar,
            text="Pozycji: 17",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=THEME["cyan"]
        )
        self.lbl_positions_count.pack(side="right", padx=8)

        # 3. KONTENER WIDOKU TABELI
        self.table_container = ctk.CTkFrame(self.library_frame, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        self.table_container.pack(fill="both", expand=True)

        self.header_frame = ctk.CTkFrame(self.table_container, fg_color="#101722", height=44, corner_radius=0)
        self.header_frame.pack(fill="x", padx=4, pady=(4, 2))
        self._build_table_header(self.header_frame)

        self.rows_scroll = ctk.CTkScrollableFrame(self.table_container, fg_color=THEME["bg_app"], corner_radius=8)
        self.rows_scroll.pack(fill="both", expand=True, padx=4, pady=4)

        # 4. KONTENER WIDOKU WIRTUALNEJ PÓŁKI
        self.shelf_scroll = ctk.CTkScrollableFrame(self.library_frame, fg_color=THEME["bg_app"], corner_radius=10, border_width=1, border_color=THEME["border"])
        # (ukryty domyślnie, włączany po przełączeniu)

    def _on_view_mode_change(self, mode_str):
        if "Półka" in mode_str:
            self.view_mode = "shelf"
            self.table_container.pack_forget()
            self.shelf_scroll.pack(fill="both", expand=True)
        else:
            self.view_mode = "table"
            self.shelf_scroll.pack_forget()
            self.table_container.pack(fill="both", expand=True)
        self.refresh_library()

    def _build_table_header(self, parent):
        parent.columnconfigure(0, weight=0, minsize=32)
        parent.columnconfigure(1, weight=0, minsize=32)
        parent.columnconfigure(2, weight=3, minsize=240)
        parent.columnconfigure(3, weight=0, minsize=65)
        parent.columnconfigure(4, weight=0, minsize=85)
        parent.columnconfigure(5, weight=1, minsize=140)
        parent.columnconfigure(6, weight=1, minsize=130)
        parent.columnconfigure(7, weight=0, minsize=75)
        parent.columnconfigure(8, weight=0, minsize=105)
        parent.columnconfigure(9, weight=0, minsize=80)
        parent.columnconfigure(10, weight=0, minsize=90)
        parent.columnconfigure(11, weight=0, minsize=80)

        headers = [
            (0, "☐", "center"),
            (1, "#", "center"),
            (2, "TYTUŁ / DZIEŁO", "w"),
            (3, "ROK", "center"),
            (4, "TYP", "center"),
            (5, "PLATFORMA", "center"),
            (6, "GATUNEK", "w"),
            (7, "OCENA", "center"),
            (8, "STATUS", "center"),
            (9, "CZAS / STR.", "center"),
            (10, "DATA", "center"),
            (11, "AKCJE", "center")
        ]

        for col_idx, text, anchor in headers:
            lbl = ctk.CTkLabel(parent, text=text, font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["cyan"], anchor=anchor)
            lbl.grid(row=0, column=col_idx, sticky="nsew", padx=6, pady=10)

    def refresh_year_bookmarks(self):
        for w in self.years_buttons_frame.winfo_children():
            w.destroy()

        year_counts = self.db.get_distinct_years_with_counts()
        total_items = sum(year_counts.values())

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

    def refresh_library(self):
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

        if self.view_mode == "table":
            self._render_table_rows(filtered_items)
        else:
            self._render_virtual_shelf(filtered_items)

    def _render_table_rows(self, filtered_items):
        for w in self.rows_scroll.winfo_children():
            w.destroy()

        if not filtered_items:
            empty_box = ctk.CTkFrame(self.rows_scroll, fg_color=THEME["bg_card"], corner_radius=10)
            empty_box.pack(fill="x", padx=10, pady=40)
            ctk.CTkLabel(
                empty_box,
                text="Brak pozycji spełniających podane kryteria filtrowania.\\nKliknij '➕ Dodaj pozycję' lub zmień filtry.",
                font=ctk.CTkFont(size=13),
                text_color=THEME["text_muted"]
            ).pack(pady=30)
            return

        for idx, item in enumerate(filtered_items, start=1):
            row_card = ctk.CTkFrame(self.rows_scroll, fg_color=THEME["bg_card"], corner_radius=8, border_width=1, border_color=THEME["border"], height=58)
            row_card.pack(fill="x", padx=4, pady=3)
            row_card.pack_propagate(False)

            row_card.columnconfigure(0, weight=0, minsize=32)
            row_card.columnconfigure(1, weight=0, minsize=32)
            row_card.columnconfigure(2, weight=3, minsize=240)
            row_card.columnconfigure(3, weight=0, minsize=65)
            row_card.columnconfigure(4, weight=0, minsize=85)
            row_card.columnconfigure(5, weight=1, minsize=140)
            row_card.columnconfigure(6, weight=1, minsize=130)
            row_card.columnconfigure(7, weight=0, minsize=75)
            row_card.columnconfigure(8, weight=0, minsize=105)
            row_card.columnconfigure(9, weight=0, minsize=80)
            row_card.columnconfigure(10, weight=0, minsize=90)
            row_card.columnconfigure(11, weight=0, minsize=80)

            ctk.CTkCheckBox(row_card, text="", width=20, corner_radius=4).grid(row=0, column=0, sticky="nsew", padx=6)
            ctk.CTkLabel(row_card, text=str(idx), font=ctk.CTkFont(size=11), text_color=THEME["text_muted"]).grid(row=0, column=1, sticky="nsew", padx=4)

            # Tytuł
            t_box = ctk.CTkFrame(row_card, fg_color="transparent")
            t_box.grid(row=0, column=2, sticky="nsew", padx=8, pady=4)
            ctk.CTkLabel(t_box, text=item["title"], font=ctk.CTkFont(size=13, weight="bold"), text_color=THEME["text_white"]).pack(anchor="w")
            if item.get("comment"):
                ctk.CTkLabel(t_box, text=f'"{item["comment"][:50]}..."', font=ctk.CTkFont(size=10, slant="italic"), text_color=THEME["text_muted"]).pack(anchor="w")

            ctk.CTkLabel(row_card, text=str(item["year"] or "-"), font=ctk.CTkFont(size=12), text_color=THEME["text_light"]).grid(row=0, column=3, sticky="nsew", padx=4)

            # Typ odznaka z dynamicznym kolorem i ikonką
            itype = item["item_type"]
            st = get_type_style(itype)
            ctk.CTkLabel(row_card, text=f"{st['icon']} {itype}", font=ctk.CTkFont(size=11, weight="bold"), text_color=st["color"], fg_color=st["bg"], corner_radius=6, padx=8, pady=2).grid(row=0, column=4, padx=6)
            ctk.CTkLabel(row_card, text=item["platform"] or "-", font=ctk.CTkFont(size=11), text_color=THEME["text_light"], fg_color="#182333", corner_radius=6, padx=8, pady=2).grid(row=0, column=5, padx=6)
            ctk.CTkLabel(row_card, text=item["genre"] or "-", font=ctk.CTkFont(size=11), text_color=THEME["text_light"], anchor="w").grid(row=0, column=6, sticky="w", padx=8)
            ctk.CTkLabel(row_card, text=f"★ {item['rating']:.1f}", font=ctk.CTkFont(size=12, weight="bold"), text_color=THEME["gold"]).grid(row=0, column=7, sticky="nsew", padx=4)

            # Status
            stat = item["status"]
            s_bg = THEME["status_done_bg"] if stat == "Ukończone" else THEME["status_prog_bg"]
            s_fg = THEME["status_done_fg"] if stat == "Ukończone" else THEME["status_prog_fg"]
            ctk.CTkLabel(row_card, text=stat, font=ctk.CTkFont(size=11, weight="bold"), text_color=s_fg, fg_color=s_bg, corner_radius=12, padx=8, pady=2).grid(row=0, column=8, padx=6)

            # Czas / Strony
            h_val = item.get("hours_spent")
            p_val = item.get("pages")
            val_txt = f"{h_val:.1f} h" if h_val else (f"{p_val} str." if p_val else "-")
            ctk.CTkLabel(row_card, text=val_txt, font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["cyan"]).grid(row=0, column=9, sticky="nsew", padx=4)

            ctk.CTkLabel(row_card, text=item["date_logged"] or "-", font=ctk.CTkFont(size=11), text_color=THEME["text_muted"]).grid(row=0, column=10, sticky="nsew", padx=4)

            # Akcje
            ab = ctk.CTkFrame(row_card, fg_color="transparent")
            ab.grid(row=0, column=11, padx=4)
            ctk.CTkButton(ab, text="✏️", width=28, height=28, fg_color="#1e2c3e", hover_color="#2b435e", corner_radius=6, command=lambda it=item: self.open_edit_dialog(it)).pack(side="left", padx=2)
            ctk.CTkButton(ab, text="🗑️", width=28, height=28, fg_color=THEME["red"], hover_color=THEME["red_hover"], corner_radius=6, command=lambda it_id=item["id"], t=item["title"]: self.delete_single_item(it_id, t)).pack(side="left", padx=2)

    def _render_virtual_shelf(self, filtered_items):
        """Renderuje widok Wirtualnej Półki z kolorowymi grzbietami na regałach."""
        for w in self.shelf_scroll.winfo_children():
            w.destroy()

        if not filtered_items:
            empty_box = ctk.CTkFrame(self.shelf_scroll, fg_color=THEME["bg_card"], corner_radius=10)
            empty_box.pack(fill="x", padx=10, pady=40)
            ctk.CTkLabel(
                empty_box,
                text="Pusta Wirtualna Półka.\\nBrak dzieł spełniających kryteria.",
                font=ctk.CTkFont(size=14, weight="bold"),
                text_color=THEME["text_muted"]
            ).pack(pady=30)
            return

        # Legenda kolorów i ikon
        leg_frame = ctk.CTkFrame(self.shelf_scroll, fg_color="#141d2b", corner_radius=8, border_width=1, border_color=THEME["border"])
        leg_frame.pack(fill="x", padx=10, pady=(6, 14))

        ctk.CTkLabel(leg_frame, text="KOLORYSTYKA REGAŁU & IKONY:", font=ctk.CTkFont(size=11, weight="bold"), text_color=THEME["cyan"]).pack(side="left", padx=12, pady=8)
        for key in ["gra", "książka", "film", "serial", "komiks", "anime", "manga", "podcast", "planszówka", "dokument"]:
            st = DEFAULT_TYPE_STYLES[key]
            ctk.CTkLabel(leg_frame, text=f"{st['icon']} {st['name']}", font=ctk.CTkFont(size=10, weight="bold"), text_color=st["accent"]).pack(side="left", padx=5)

        # Dzielenie na półki po 9 pozycji
        SHELF_CHUNK = 9
        shelf_chunks = [filtered_items[i:i + SHELF_CHUNK] for i in range(0, len(filtered_items), SHELF_CHUNK)]

        for tier_idx, chunk in enumerate(shelf_chunks, start=1):
            shelf_box = ctk.CTkFrame(self.shelf_scroll, fg_color="#0e1620", corner_radius=8, border_width=1, border_color="#1e2f42")
            shelf_box.pack(fill="x", padx=10, pady=10)

            # Rząd grzbietów
            spines_row = ctk.CTkFrame(shelf_box, fg_color="transparent")
            spines_row.pack(fill="x", padx=16, pady=(16, 0))

            for item in chunk:
                itype = item.get("item_type") or "Gra"
                st = get_type_style(itype)
                spine_color = st["spine_bg"]
                icon = st["icon"]
                accent_col = st["accent"]
                h_val = st["h"]
                w_val = st["w"]

                # Dynamiczne gabaryty w zaleznosci od stron / godzin
                p_cnt = item.get("pages")
                h_cnt = item.get("hours_spent")
                if p_cnt and p_cnt > 0:
                    w_val = min(94, max(76, 74 + int(p_cnt * 0.025)))
                    h_val = min(245, max(215, 215 + int(p_cnt * 0.03)))
                elif h_cnt and h_cnt > 0:
                    w_val = min(90, max(74, 74 + int(h_cnt * 0.1)))
                    h_val = min(235, max(210, 210 + int(h_cnt * 0.15)))

                # Kontener pojedynczego grzbietu (pionowe pudełko)
                spine = ctk.CTkFrame(
                    spines_row,
                    fg_color=spine_color,
                    corner_radius=4,
                    border_width=2,
                    border_color=accent_col,
                    width=w_val,
                    height=h_val
                )
                spine.pack(side="left", padx=5, pady=0)
                spine.pack_propagate(False)

                # Górna wstążka z ikoną
                ctk.CTkLabel(spine, text=icon, font=ctk.CTkFont(size=14)).pack(pady=(6, 2))

                # Skrócony tytuł na grzbiecie
                title_clean = item["title"]
                if len(title_clean) > 28:
                    title_clean = title_clean[:25] + "..."
                lbl_t = ctk.CTkLabel(
                    spine,
                    text=title_clean,
                    font=ctk.CTkFont(size=11, weight="bold"),
                    text_color="#ffffff",
                    wraplength=w_val - 10,
                    justify="center"
                )
                lbl_t.pack(expand=True, padx=4)

                # Ocena u podstawy grzbietu (np. Wiedźmin 3 ★9.8)
                rate_lbl = ctk.CTkLabel(
                    spine,
                    text=f"★ {item['rating']:.1f}",
                    font=ctk.CTkFont(size=11, weight="bold"),
                    text_color=THEME["gold"]
                )
                rate_lbl.pack(side="bottom", pady=(0, 6))

                # Kliknięcie grzbietu otwiera CTkToplevel ze szczegółami pozycji
                def make_click(it_data=item):
                    return lambda e: self.open_shelf_item_details(it_data)

                spine.bind("<Button-1>", make_click())
                lbl_t.bind("<Button-1>", make_click())
                rate_lbl.bind("<Button-1>", make_click())

            # Ciemna metalowa półka z podświetleniem LED
            shelf_beam = ctk.CTkFrame(shelf_box, fg_color="#1e293b", height=14, corner_radius=0)
            shelf_beam.pack(fill="x", pady=(8, 0))

            led_strip = ctk.CTkFrame(shelf_box, fg_color="#38bdf8", height=3, corner_radius=0)
            led_strip.pack(fill="x", pady=(0, 0))

    def open_shelf_item_details(self, item):
        """Otwiera okno szczegółów dzieła (CTkToplevel)."""
        ItemDetailsDialog(
            self,
            self.db,
            item,
            on_edit_callback=lambda it: self.open_edit_dialog(it),
            on_delete_callback=lambda it_id, title: self.delete_single_item(it_id, title)
        )

    def _build_stats_view(self):
        self.stats_scroll = ctk.CTkScrollableFrame(self.stats_frame, fg_color="transparent")
        self.stats_scroll.pack(fill="both", expand=True)

        b_social = ctk.CTkFrame(self.stats_scroll, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        b_social.pack(fill="x", pady=(0, 12))

        b_left = ctk.CTkFrame(b_social, fg_color="transparent")
        b_left.pack(side="left", padx=16, pady=12)

        ctk.CTkLabel(b_left, text="📱 Podsumowanie • Eksport grafiki na Social Media", font=ctk.CTkFont(size=14, weight="bold"), text_color="#ffffff").pack(anchor="w")
        ctk.CTkLabel(b_left, text="Wygeneruj plik graficzny (PNG) gotowy do wrzucenia na Instagram, Facebook, X ze swoimi Dziełami Roku.", font=ctk.CTkFont(size=11), text_color=THEME["text_muted"]).pack(anchor="w", pady=(2, 0))

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

        # Rząd 4 Kart Metryk
        metrics_row = ctk.CTkFrame(self.stats_scroll, fg_color="transparent")
        metrics_row.pack(fill="x", pady=(0, 12))
        for i in range(4):
            metrics_row.columnconfigure(i, weight=1)

        self.m_card_hours = self._create_metric_card(metrics_row, 0, "ŁĄCZNY CZAS", "0.0 h", "Gry, książki, filmy, seriale", THEME["cyan"])
        self.m_card_done = self._create_metric_card(metrics_row, 1, "UKOŃCZONE DZIEŁA", "0", "100% zrealizowane", "#4ade80")
        self.m_card_rate = self._create_metric_card(metrics_row, 2, "ŚREDNIA OCENA", "0.0 / 10", "Wszystkie dzieła", THEME["gold"])
        self.m_card_bg = self._create_metric_card(metrics_row, 3, "PRZECZYTANE STRONY", "0 str.", "Książki i komiksy", "#c084fc")

        # Sekcja Dzieła Roku
        awards_box = ctk.CTkFrame(self.stats_scroll, fg_color=THEME["bg_banner"], corner_radius=10, border_width=1, border_color=THEME["border"])
        awards_box.pack(fill="x", pady=(0, 12))

        aw_head = ctk.CTkFrame(awards_box, fg_color="transparent")
        aw_head.pack(fill="x", padx=16, pady=(12, 8))

        ctk.CTkLabel(aw_head, text="🏆 DZIEŁA ROKU (TOP WYBORY WG KATEGORII)", font=ctk.CTkFont(size=13, weight="bold"), text_color=THEME["gold"]).pack(side="left")

        self.combo_aw_year = ctk.CTkComboBox(aw_head, values=["2026", "2025", "2024", "2023", "Wszystkie"], width=110, height=32, fg_color=THEME["bg_input"], border_color=THEME["border"], command=lambda v: self._update_awards())
        self.combo_aw_year.set("2026")
        self.combo_aw_year.pack(side="right")

        self.awards_grid = ctk.CTkFrame(awards_box, fg_color="transparent")
        self.awards_grid.pack(fill="x", padx=12, pady=(0, 14))
        for i in range(4):
            self.awards_grid.columnconfigure(i, weight=1)

        self.aw_labels = {}
        cats = [
            ("Gra", "🎮 GRA ROKU", THEME["cyan"]),
            ("Książka", "📖 KSIĄŻKA ROKU", THEME["gold"]),
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
        self.m_card_rate.configure(text=f"{stats['avg_rating']:.1f} / 10 ★")
        self.m_card_bg.configure(text=f"{stats['total_pages']} str.")
        self._update_awards()

    def _update_awards(self):
        yr = self.combo_aw_year.get()
        awards = self.db.get_year_awards(yr)
        for cat, (lbl_t, lbl_sub) in self.aw_labels.items():
            item = awards.get(cat)
            if item:
                lbl_t.configure(text=item["title"])
                lbl_sub.configure(text=f"★ {item['rating']:.1f}  •  {item['hours_spent']:.1f}h  •  {item['platform']}")
            else:
                lbl_t.configure(text="Brak wpisu")
                lbl_sub.configure(text="-")

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
            f"Czy na pewno chcesz bezpowrotnie usunąć z bazy danych:\\n\\n'{title}'?",
            parent=self
        )
        if confirm:
            self.db.delete_item(item_id)
            self.refresh_year_bookmarks()
            self.refresh_library()
            if self.active_tab == "stats":
                self.refresh_stats()

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
                fieldnames = ["id", "title", "year", "item_type", "platform", "genre", "rating", "status", "hours_spent", "pages", "date_logged", "comment"]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for it in items:
                    writer.writerow(it)
            messagebox.showinfo("Sukces", f"Wyeksportowano {len(items)} pozycji do pliku:\\n{path}", parent=self)
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
            delim = ';' if semi_c > comma_c else ','

            import io, re
            f_io = io.StringIO(content)
            reader = csv.DictReader(f_io, delimiter=delim)

            for r in reader:
                title = r.get("title") or r.get("tytuł") or r.get("tytul") or ""
                if not title.strip():
                    continue

                itype = r.get("item_type") or r.get("typ") or "Gra"
                yr_s = str(r.get("year") or r.get("rok") or "").strip().replace(",", ".")
                try:
                    yr = int(round(float(yr_s))) if yr_s else None
                except ValueError:
                    yr = None
                plat = r.get("platform") or r.get("platforma") or "PC (Cyfrowa)"
                genre = r.get("genre") or r.get("gatunek") or "Inny"
                try:
                    rate = float(str(r.get("rating") or r.get("ocena") or "8.0").replace(",", "."))
                except ValueError:
                    rate = 8.0
                stat = r.get("status") or "Ukończone"
                try:
                    hrs = float(str(r.get("hours_spent") or r.get("godziny") or "0").replace(",", "."))
                except ValueError:
                    hrs = 0.0
                try:
                    pgs_s = str(r.get("pages") or r.get("strony") or "0").strip().replace(",", ".")
                    pgs = int(round(float(pgs_s))) if pgs_s else 0
                except ValueError:
                    pgs = 0
                date_l = r.get("date_logged") or r.get("data") or datetime.today().strftime("%Y-%m-%d")
                comm = r.get("comment") or r.get("komentarz") or ""

                self.db.add_item({
                    "title": title.strip(),
                    "year": yr,
                    "item_type": itype.strip(),
                    "platform": plat.strip(),
                    "genre": genre.strip(),
                    "rating": round(rate, 1),
                    "status": stat.strip(),
                    "hours_spent": round(hrs, 1),
                    "pages": pgs,
                    "date_logged": date_l.strip(),
                    "comment": comm.strip()
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

            ax.text(5, 9.3, "SHELFMEDIA", color="#66c0f4", fontsize=16, fontweight="bold", ha="center")
            yr_label = self.active_year if self.active_year != "Wszystkie lata" else "CAŁOKSZTAŁT"
            ax.text(5, 8.8, f"PODSUMOWANIE ROKU • {yr_label}", color="#ffffff", fontsize=12, fontweight="bold", ha="center")

            ax.text(2.5, 7.8, "CZAS", color="#8f98a0", fontsize=8, fontweight="bold", ha="center")
            ax.text(2.5, 7.4, f"{stats['total_hours']:.0f} h", color="#66c0f4", fontsize=14, fontweight="bold", ha="center")

            ax.text(5.0, 7.8, "UKOŃCZONE", color="#8f98a0", fontsize=8, fontweight="bold", ha="center")
            ax.text(5.0, 7.4, f"{stats['completed_count']}", color="#4ade80", fontsize=14, fontweight="bold", ha="center")

            ax.text(7.5, 7.8, "ŚREDNIA", color="#8f98a0", fontsize=8, fontweight="bold", ha="center")
            ax.text(7.5, 7.4, f"{stats['avg_rating']:.1f} ★", color="#f1c40f", fontsize=14, fontweight="bold", ha="center")

            fig.savefig(path, facecolor=fig.get_facecolor(), edgecolor="none", bbox_inches="tight")
            messagebox.showinfo("Sukces", f"Pomyślnie wygenerowano grafikę na sociale:\\n\\n{path}", parent=self)
        except Exception as e:
            messagebox.showerror("Błąd", f"Nie udało się wygenerować grafiki: {e}", parent=self)


def main():
    app = MediaTrackerApp()
    app.mainloop()

if __name__ == "__main__":
    main()
`;

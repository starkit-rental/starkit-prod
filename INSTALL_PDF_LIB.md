# Instalacja pdf-lib - Instrukcja

## Problem
Podczas automatycznej instalacji wystąpił błąd npm. Musisz zainstalować bibliotekę `pdf-lib` ręcznie.

## Rozwiązanie

Wybierz jedną z poniższych metod:

### Metoda 1: npm (zalecane)
```bash
cd /Users/godekmaciej/starkit-system
npm install pdf-lib
```

### Metoda 2: Jeśli npm nie działa
```bash
# Wyczyść cache npm
npm cache clean --force

# Usuń node_modules i package-lock.json
rm -rf node_modules package-lock.json

# Zainstaluj wszystko od nowa
npm install

# Zainstaluj pdf-lib
npm install pdf-lib
```

### Metoda 3: Yarn
```bash
yarn add pdf-lib
```

### Metoda 4: Manualna edycja package.json
Dodaj do sekcji `dependencies` w `package.json`:
```json
"pdf-lib": "^1.17.1"
```

Następnie uruchom:
```bash
npm install
```

## Weryfikacja
Po instalacji sprawdź czy biblioteka została zainstalowana:
```bash
ls node_modules/pdf-lib
```

Powinieneś zobaczyć zawartość folderu z biblioteką.

## Uruchomienie aplikacji
Po pomyślnej instalacji:
```bash
npm run dev
```

Błąd TypeScript "Cannot find module 'pdf-lib'" powinien zniknąć.

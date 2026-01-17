# Требования к разработке игры «Сеть» (NetWalk)

**Версия документа:** 1.0  
**Дата:** 17 января 2026  
**Платформы:** Web (PWA), Android

---

## 1. Общее описание

### 1.1 Концепция игры

«Сеть» (NetWalk / QNetWalk) — логическая головоломка, в которой игрок выступает в роли системного администратора, восстанавливающего компьютерную сеть. Цель — соединить все компьютеры с центральным сервером, поворачивая сегменты кабелей.

### 1.2 Целевая аудитория

- Любители логических головоломок
- Возраст: 10+
- Платформы: мобильные устройства, десктопные браузеры

### 1.3 Ключевые особенности MVP

- Три уровня сложности
- Локальная таблица рекордов
- Полностью офлайн-режим
- Единая кодовая база для web и Android (рекомендация)

---

## 2. Игровая механика

### 2.1 Игровое поле

Прямоугольная сетка клеток, размер зависит от уровня сложности:

| Сложность | Размер поля | Кол-во компьютеров | Доп. рёбра |
|-----------|-------------|---------------------|------------|
| Лёгкий    | 5×5         | 4–6                 | 0%         |
| Средний   | 7×7         | 8–12                | 10–15%     |
| Сложный   | 9×9         | 12–18               | 20–30%     |

### 2.2 Элементы поля

| Элемент | Описание | Поведение |
|---------|----------|-----------|
| **Сервер** | Источник сети, центральный узел | Фиксированный, не вращается |
| **Компьютер** | Конечный узел, требует подключения | Имеет 1 выход, вращается |
| **Прямой кабель** | Соединяет 2 противоположные стороны | Вращается (2 состояния) |
| **Угловой кабель** | Соединяет 2 соседние стороны | Вращается (4 состояния) |
| **T-разветвитель** | Соединяет 3 стороны | Вращается (4 состояния) |
| **Крестовина** | Соединяет 4 стороны | Не меняется при вращении |
| **Пустая клетка** | Нет соединений | Не интерактивна |

### 2.3 Управление

| Действие | Web (мышь) | Web (тач) | Android |
|----------|-----------|-----------|---------|
| Поворот по часовой (90°) | ЛКМ | Тап | Тап |
| Поворот против часовой | ПКМ | Долгий тап | Долгий тап |

### 2.4 Условия победы

1. Все компьютеры соединены с сервером непрерывной цепью кабелей
2. Нет «висящих» концов — каждый выход кабеля соединён с соседним элементом
3. Вся активная сеть связна (нет изолированных сегментов)

### 2.5 Система оценки

**Метрики:**
- Количество ходов (поворотов)
- Затраченное время

**Расчёт очков:**
```
score = base_score × time_multiplier × moves_multiplier

base_score = grid_width × grid_height × 100

time_multiplier:
  - < ideal_time: 2.0
  - < ideal_time × 2: 1.5
  - < ideal_time × 3: 1.0
  - иначе: 0.5

moves_multiplier:
  - < ideal_moves: 2.0
  - < ideal_moves × 1.5: 1.5
  - < ideal_moves × 2: 1.0
  - иначе: 0.5
```

**Идеальные показатели (по сложности):**

| Сложность | Идеальное время | Идеальные ходы |
|-----------|-----------------|----------------|
| Лёгкий    | 60 сек          | 25             |
| Средний   | 180 сек         | 60             |
| Сложный   | 360 сек         | 120            |

---

## 3. Генерация уровней

### 3.1 Алгоритм (гарантия решаемости)

1. **Создание решённой сети:**
   - Разместить сервер (центр или случайная позиция)
   - Построить spanning tree (случайный DFS/Prim) от сервера
   - Добавить дополнительные рёбра с заданной вероятностью
   - Разместить компьютеры на листьях дерева

2. **Определение типов элементов:**
   - По количеству соединений клетки определить тип кабеля
   - Установить корректную ориентацию

3. **Перемешивание:**
   - Случайно повернуть каждый элемент (1–3 раза)
   - Проверить, что уровень не решён изначально
   - Если решён — перемешать повторно

### 3.2 Псевдокод генератора

```
function generateLevel(width, height, difficulty):
    grid = createEmptyGrid(width, height)
    server = placeServer(grid)
    
    // Построение spanning tree
    visited = {server}
    stack = [server]
    while stack not empty:
        current = stack.pop()
        neighbors = getUnvisitedNeighbors(current, grid)
        shuffle(neighbors)
        for neighbor in neighbors:
            connect(current, neighbor)
            visited.add(neighbor)
            stack.push(neighbor)
    
    // Дополнительные рёбра (для средней/сложной)
    if difficulty > EASY:
        for each possible edge not in tree:
            if random() < extraEdgeProbability[difficulty]:
                addEdge(edge)
    
    // Размещение компьютеров
    leaves = findLeaves(grid)
    placeComputers(leaves, count[difficulty])
    
    // Определение типов элементов
    for each cell in grid:
        cell.type = determineType(cell.connections)
        cell.correctRotation = calculateRotation(cell)
    
    // Перемешивание
    repeat:
        for each cell in grid (except server):
            cell.rotation = random(0, 3)
    until not isSolved(grid)
    
    return grid
```

---

## 4. Алгоритм проверки решения

### 4.1 Проверка связности (BFS)

```
function isSolved(grid):
    server = findServer(grid)
    visited = BFS(grid, server)
    
    // Проверка 1: все компьютеры достижимы
    for each computer in grid:
        if computer not in visited:
            return false
    
    // Проверка 2: нет висящих концов
    for each cell in grid:
        for each direction in cell.openDirections():
            neighbor = getNeighbor(cell, direction)
            if neighbor is null:
                return false  // выход за границу
            oppositeDir = opposite(direction)
            if oppositeDir not in neighbor.openDirections():
                return false  // сосед не имеет встречного соединения
    
    return true
```

### 4.2 Определение открытых направлений

```
function getOpenDirections(type, rotation):
    base = {
        "straight": [NORTH, SOUTH],
        "corner": [NORTH, EAST],
        "t_junction": [NORTH, EAST, WEST],
        "cross": [NORTH, EAST, SOUTH, WEST],
        "computer": [NORTH],
        "server": [NORTH, EAST, SOUTH, WEST],  // или по конфигурации
        "empty": []
    }
    return rotateDirections(base[type], rotation)
```

---

## 5. Функциональные требования

### 5.1 Основной игровой процесс

| ID | Требование | Приоритет |
|----|------------|-----------|
| F-001 | Отображение игрового поля с элементами сети | Высокий |
| F-002 | Поворот элементов по/против часовой стрелки | Высокий |
| F-003 | Визуальная индикация подключённых элементов | Высокий |
| F-004 | Автоматическая проверка решения после каждого хода | Высокий |
| F-005 | Отображение счётчика ходов | Высокий |
| F-006 | Отображение таймера | Высокий |
| F-007 | Экран победы с результатами | Высокий |
| F-008 | Анимация поворота элементов | Средний |
| F-009 | Анимация «волны» подключения при победе | Низкий |

### 5.2 Меню и навигация

| ID | Требование | Приоритет |
|----|------------|-----------|
| F-010 | Главное меню (Новая игра, Продолжить, Рекорды, Настройки) | Высокий |
| F-011 | Выбор уровня сложности | Высокий |
| F-012 | Пауза игры с возможностью продолжить/выйти | Высокий |
| F-013 | Кнопка перезапуска уровня | Высокий |

### 5.3 Сохранение и прогресс

| ID | Требование | Приоритет |
|----|------------|-----------|
| F-014 | Автосохранение текущей игры при выходе | Высокий |
| F-015 | Восстановление игры при запуске | Высокий |
| F-016 | Локальная таблица рекордов (топ-10 по каждой сложности) | Высокий |
| F-017 | Сохранение статистики (игр сыграно, лучшее время) | Средний |

### 5.4 Дополнительные функции

| ID | Требование | Приоритет |
|----|------------|-----------|
| F-018 | Функция отмены хода (Undo) | Средний |
| F-019 | Подсказка (показать один правильный поворот) | Низкий |
| F-020 | Звуковые эффекты | Низкий |

---

## 6. Нефункциональные требования

### 6.1 Производительность

| ID | Требование |
|----|------------|
| NF-001 | Время загрузки приложения < 3 сек |
| NF-002 | Генерация уровня < 500 мс |
| NF-003 | Отклик на действие пользователя < 100 мс |
| NF-004 | Анимация поворота 60 FPS |
| NF-005 | Потребление памяти < 100 MB |

### 6.2 Совместимость

| ID | Требование |
|----|------------|
| NF-006 | Web: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ |
| NF-007 | Android: API 24+ (Android 7.0+) |
| NF-008 | Адаптивный дизайн для экранов 320px – 1920px |
| NF-009 | Поддержка портретной и ландшафтной ориентации |

### 6.3 Офлайн-режим

| ID | Требование |
|----|------------|
| NF-010 | Полная функциональность без интернета |
| NF-011 | Web: работа как PWA (Service Worker) |
| NF-012 | Локальное хранение данных (IndexedDB / SharedPreferences) |

---

## 7. Архитектура

### 7.1 Рекомендуемый технологический стек

**Вариант A: Единая кодовая база (рекомендуется)**

| Компонент | Технология |
|-----------|------------|
| Фреймворк | React Native Web / Flutter |
| Язык | TypeScript / Dart |
| Состояние | Zustand / Riverpod |
| Хранение | AsyncStorage + IndexedDB |
| Сборка Web | Vite / Flutter Web |
| Контейнеризация | Docker + nginx |

**Вариант B: Раздельная разработка**

| Платформа | Технология |
|-----------|------------|
| Web | React + TypeScript + Vite |
| Android | Kotlin + Jetpack Compose |
| Общее | Shared game logic (Kotlin Multiplatform) |

### 7.2 Структура проекта (Вариант A — React/TypeScript)

```
netwalk/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── engine/
│   │   ├── types.ts
│   │   ├── Grid.ts
│   │   ├── Cell.ts
│   │   ├── LevelGenerator.ts
│   │   ├── ConnectionValidator.ts
│   │   └── ScoreCalculator.ts
│   ├── store/
│   │   ├── gameStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useGame.ts
│   │   └── useStorage.ts
│   ├── components/
│   │   ├── GameBoard/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── Cell.tsx
│   │   │   └── GameBoard.css
│   │   ├── UI/
│   │   │   ├── Menu.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── MoveCounter.tsx
│   │   │   ├── WinScreen.tsx
│   │   │   └── Leaderboard.tsx
│   │   └── common/
│   ├── screens/
│   │   ├── MainMenu.tsx
│   │   ├── GameScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── utils/
│   │   └── storage.ts
│   └── assets/
│       ├── sprites/
│       └── sounds/
└── android/                    # Capacitor/TWA wrapper
    └── ...
```

### 7.3 Ключевые модули

**7.3.1 Типы данных (types.ts)**

```typescript
enum CellType {
  EMPTY = 'empty',
  STRAIGHT = 'straight',
  CORNER = 'corner',
  T_JUNCTION = 't_junction',
  CROSS = 'cross',
  COMPUTER = 'computer',
  SERVER = 'server'
}

enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3
}

interface Cell {
  type: CellType
  rotation: number  // 0-3
  isConnected: boolean
  isLocked: boolean
  x: number
  y: number
}

interface GameState {
  grid: Cell[][]
  width: number
  height: number
  moves: number
  startTime: number
  difficulty: Difficulty
  isCompleted: boolean
}

interface LeaderboardEntry {
  id: string
  difficulty: Difficulty
  score: number
  moves: number
  time: number
  date: string
}
```

**7.3.2 Генератор уровней (LevelGenerator.ts)**

```typescript
class LevelGenerator {
  generate(difficulty: Difficulty): GameState
  private createSpanningTree(): void
  private addExtraEdges(probability: number): void
  private placeComputers(count: number): void
  private determineCellTypes(): void
  private scramble(): void
  private ensureNotSolved(): boolean
}
```

**7.3.3 Валидатор соединений (ConnectionValidator.ts)**

```typescript
class ConnectionValidator {
  validate(grid: Cell[][]): ValidationResult
  getConnectedCells(grid: Cell[][]): Set<Cell>
  private bfs(start: Cell): Set<Cell>
  private getOpenDirections(cell: Cell): Direction[]
  private hasMatchingConnection(cell: Cell, neighbor: Cell, dir: Direction): boolean
}

interface ValidationResult {
  isValid: boolean
  connectedCells: Set<Cell>
  disconnectedComputers: Cell[]
  hangingEnds: Array<{cell: Cell, direction: Direction}>
}
```

---

## 8. Docker-конфигурация

### 8.1 Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 8.2 docker-compose.yml

```yaml
version: '3.8'

services:
  netwalk:
    build: .
    container_name: netwalk-game
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 8.3 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }
}
```

---

## 9. Пользовательский интерфейс

### 9.1 Экраны приложения

```
┌─────────────────────────────────────────────────────┐
│                    ГЛАВНОЕ МЕНЮ                      │
│                                                     │
│                     🌐 СЕТЬ                          │
│                                                     │
│              ┌─────────────────────┐                │
│              │    НОВАЯ ИГРА       │                │
│              └─────────────────────┘                │
│              ┌─────────────────────┐                │
│              │    ПРОДОЛЖИТЬ       │                │
│              └─────────────────────┘                │
│              ┌─────────────────────┐                │
│              │    РЕКОРДЫ          │                │
│              └─────────────────────┘                │
│              ┌─────────────────────┐                │
│              │    НАСТРОЙКИ        │                │
│              └─────────────────────┘                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  ВЫБОР СЛОЖНОСТИ                     │
│                                                     │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│    │ ЛЁГКИЙ  │  │ СРЕДНИЙ │  │ СЛОЖНЫЙ │           │
│    │  5×5    │  │   7×7   │  │   9×9   │           │
│    └─────────┘  └─────────┘  └─────────┘           │
│                                                     │
│              ┌─────────────────────┐                │
│              │       НАЗАД         │                │
│              └─────────────────────┘                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ⏸️ ПАУЗА      ХОДЫ: 15        ⏱️ 01:23            │
├─────────────────────────────────────────────────────┤
│                                                     │
│    ┌───┬───┬───┬───┬───┐                           │
│    │ ╔ │ ═ │ ═ │ ╗ │   │                           │
│    ├───┼───┼───┼───┼───┤                           │
│    │ ║ │ ╬ │ ═ │ ║ │ ╔ │                           │
│    ├───┼───┼───┼───┼───┤                           │
│    │ ║ │ ║ │ ◉ │ ║ │ ║ │  ◉ = Сервер              │
│    ├───┼───┼───┼───┼───┤  🖥 = Компьютер           │
│    │ ║ │ ╠ │ ═ │ ╣ │ ║ │                           │
│    ├───┼───┼───┼───┼───┤                           │
│    │ 🖥│ ═ │ ═ │ ═ │ 🖥│                           │
│    └───┴───┴───┴───┴───┘                           │
│                                                     │
├─────────────────────────────────────────────────────┤
│    ↩️ ОТМЕНИТЬ          🔄 ЗАНОВО                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   🎉 ПОБЕДА! 🎉                      │
│                                                     │
│                   ОЧКИ: 2500                        │
│                                                     │
│              Ходов: 23    Время: 01:45             │
│                                                     │
│              ⭐ НОВЫЙ РЕКОРД! ⭐                     │
│                                                     │
│              ┌─────────────────────┐                │
│              │    ИГРАТЬ СНОВА     │                │
│              └─────────────────────┘                │
│              ┌─────────────────────┐                │
│              │    ГЛАВНОЕ МЕНЮ     │                │
│              └─────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

### 9.2 Цветовая схема

| Элемент | Цвет | HEX |
|---------|------|-----|
| Фон игрового поля | Тёмно-серый | #1a1a2e |
| Неподключённый кабель | Серый | #4a4a5a |
| Подключённый кабель | Зелёный | #00d26a |
| Висящий конец | Красный | #ff4757 |
| Сервер | Жёлтый | #ffd93d |
| Компьютер (откл.) | Синий | #3498db |
| Компьютер (подкл.) | Зелёный | #2ecc71 |
| Фон ячейки | Тёмный | #16213e |
| Рамка ячейки | Серый | #2d3748 |

### 9.3 Спрайты элементов

Для каждого типа элемента нужно 4 варианта (по одному на каждый поворот) или один базовый с программным поворотом:

```
sprites/
├── server.svg
├── computer_off.svg
├── computer_on.svg
├── cable_straight.svg
├── cable_corner.svg
├── cable_t.svg
├── cable_cross.svg
└── empty.svg
```

---

## 10. Формат данных

### 10.1 Сохранение игры (JSON)

```json
{
  "version": 1,
  "savedAt": "2026-01-17T12:34:56Z",
  "gameState": {
    "difficulty": "medium",
    "width": 7,
    "height": 7,
    "moves": 15,
    "elapsedTime": 83,
    "grid": [
      {"x": 0, "y": 0, "type": "corner", "rotation": 1},
      {"x": 1, "y": 0, "type": "straight", "rotation": 0},
      ...
    ],
    "serverPosition": {"x": 3, "y": 3},
    "computerPositions": [
      {"x": 0, "y": 0},
      {"x": 6, "y": 6}
    ]
  }
}
```

### 10.2 Таблица рекордов (JSON)

```json
{
  "version": 1,
  "leaderboard": {
    "easy": [
      {"score": 5000, "moves": 18, "time": 45, "date": "2026-01-17"},
      {"score": 4500, "moves": 22, "time": 52, "date": "2026-01-16"}
    ],
    "medium": [...],
    "hard": [...]
  },
  "statistics": {
    "gamesPlayed": 42,
    "gamesWon": 38,
    "totalTime": 3600,
    "totalMoves": 1250
  }
}
```

---

## 11. План разработки

### 11.1 Этап 1: Ядро игры (1-2 недели)

- [ ] Структуры данных (Cell, Grid, GameState)
- [ ] Генератор уровней
- [ ] Алгоритм проверки соединений (BFS)
- [ ] Базовая логика поворота
- [ ] Юнит-тесты для ядра

### 11.2 Этап 2: Web-интерфейс (1-2 недели)

- [ ] Отрисовка игрового поля (Canvas/SVG)
- [ ] Обработка кликов/тапов
- [ ] Анимация поворота
- [ ] UI компоненты (меню, таймер, счётчик)
- [ ] Система экранов и навигация

### 11.3 Этап 3: Сохранение и рекорды (3-5 дней)

- [ ] LocalStorage/IndexedDB обёртка
- [ ] Автосохранение игры
- [ ] Таблица рекордов
- [ ] Экран статистики

### 11.4 Этап 4: PWA и Docker (2-3 дня)

- [ ] Service Worker для офлайн
- [ ] Web App Manifest
- [ ] Dockerfile и docker-compose
- [ ] nginx конфигурация

### 11.5 Этап 5: Android (3-5 дней)

- [ ] TWA (Trusted Web Activity) обёртка или
- [ ] Capacitor/Cordova сборка
- [ ] Тестирование на устройствах
- [ ] Публикация в Play Store (опционально)

### 11.6 Этап 6: Полировка (3-5 дней)

- [ ] Звуковые эффекты
- [ ] Улучшенные анимации
- [ ] Тестирование на разных устройствах
- [ ] Исправление багов

---

## 12. Тестирование

### 12.1 Юнит-тесты

- Генерация уровней (всегда решаемы)
- Проверка соединений (корректность BFS)
- Расчёт очков
- Поворот элементов

### 12.2 Интеграционные тесты

- Полный игровой цикл
- Сохранение/загрузка
- Таблица рекордов

### 12.3 E2E тесты

- Прохождение уровня
- Навигация по меню
- Работа офлайн

---

## 13. Глоссарий

| Термин | Определение |
|--------|-------------|
| BFS | Breadth-First Search — поиск в ширину |
| PWA | Progressive Web App — прогрессивное веб-приложение |
| TWA | Trusted Web Activity — обёртка для Android |
| Spanning Tree | Остовное дерево — связный подграф без циклов |
| Висящий конец | Выход кабеля, не соединённый с соседним элементом |

---

## 14. Ссылки и ресурсы

- Исходный код QNetWalk (KDE): https://invent.kde.org/games/knetwalk
- Оригинальная игра NetWalk (Gamos, 1996)
- Вдохновение: Pipe Dream (1989), Ветка (1992)

---

*Документ подготовлен на основе анализа описаний от ChatGPT, DeepSeek, Perplexity и Qwen.*

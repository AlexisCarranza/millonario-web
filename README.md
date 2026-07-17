# ¿Quién Quiere Ser Millonario? — versión web

Prototipo funcional en HTML/CSS/JS puro (sin backend, sin PHP, sin base de datos).
Pensado para un presentador con laptop/proyector — igual que el PowerPoint original,
pero sin macros ni Excel.

## Cómo probarlo localmente

No basta con abrir `index.html` con doble clic (el navegador bloquea `fetch()` sobre
`file://`). Necesitas un mini servidor local, por ejemplo:

```bash
cd webgame
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en tu navegador.

## Cómo publicarlo en GitHub Pages

1. Copia toda esta carpeta (`webgame/`) a tu repositorio.
2. En GitHub: Settings → Pages → Source → selecciona la rama y la carpeta.
3. Listo — no necesitas configurar nada más porque todo es estático.

## Cómo editar las preguntas

Abre `data/questions.json`. Cada pregunta es un objeto:

```json
{
  "valor": 1000,
  "pregunta": "¿Texto de la pregunta?",
  "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correcta": "B"
}
```

Agrega, quita o reordena preguntas libremente — el juego se ajusta automáticamente
(la escalera de dinero a la derecha se genera sola según cuántas preguntas haya).

## Sobre las imágenes (`img/`)

Son los fondos reales del set, extraídos directamente de las relaciones XML del
`.pptm` (no elegidos a ojo):
- `bg-title.jpg` — el mismo fondo que usa la diapositiva de título en tu PPT
- `bg-stage.jpg` — el mismo fondo que usan las diapositivas de pregunta

## Sobre los sonidos (`audio/`)

Estos sí están vinculados a diapositivas reales del PPT (no elegidos al azar):
- `intro.mp3` — el audio que suena en la diapositiva de título (tema principal)
- `select.mp3`, `wrong.mp3`, `correct.mp3`, `reveal.mp3` — los 4 sonidos que
  PowerPoint tiene adjuntos a la diapositiva de pregunta (botones "Q Select",
  "Q Wrong", etc.). Como el PPT no guarda una etiqueta con el nombre exacto de
  cada botón vinculado al audio, es posible que dos de estos estén cruzados
  (ej. que `correct.mp3` en realidad sea el de incorrecto). Pruébalos y si
  están al revés, solo intercambia los nombres de archivo.
- `tension.mp3` — una de las 8 pistas de música de fondo de ~2:40 min que tenía
  el PPT (suena en loop mientras el jugador piensa la respuesta, y se detiene
  automáticamente al revelar)
- `final.mp3` — pista para la pantalla final

Si quieres afinar cuál sonido es cuál con certeza, ábrelos directamente:
`ppt/media/audio7.wav` a `audio10.wav` (los de la pregunta) y `audio17.wav`
(el de suspenso) dentro del `.pptm` descomprimido.

## Qué hace y qué no hace (todavía)

**Sí incluye:**
- Progresión de las 15 preguntas con escalera de dinero
- Las 3 ayudas clásicas: 50:50, Preguntar al público (simulado), Llamar a un amigo (simulado)
- Retirarse en cualquier momento con el dinero acumulado
- Peldaños seguros (aciertas la 5 y la 10, no puedes bajar de ahí)
- Todo el estado en el navegador — cero backend

**Ideas para la siguiente fase (cuando quieras seguir mejorando):**
- Editor visual de preguntas (en vez de editar el JSON a mano)
- Animaciones más cercanas al programa original (círculo de luces, música por etapa real)
- Modo "Dedo Rápido" (Fastest Finger) para elegir quién juega
- Guardar historial de partidas jugadas

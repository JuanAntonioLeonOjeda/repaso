# Repaso

Plataforma personal para repasar las asignaturas del Máster en Inteligencia Artificial: cada
asignatura es una serie de lecciones que resumen el temario en lenguaje cercano, con
**simulaciones** que se pueden tocar y **ejercicios con Python real** (en el navegador, con
pista y solución), y notas de cómo se hace cada cosa en un trabajo real.

- 7 asignaturas · 59 lecciones · 50 simulaciones · 214 ejercicios.
- Una sección del **TFM** (LumosNet sobre LUMOS): 9 lecciones conectadas con el temario, 8
  simulaciones más y la bitácora de experimentos reevaluada.
- **Tutoriales**: proyectos completos paso a paso, enlazados con el temario.
  - **Visión: clasificar imágenes** (PyTorch, CIFAR-10): 8 lecciones, 1 simulación y 24
    ejercicios, del dataset a servir el modelo. El código de PyTorch no corre en el navegador:
    lo ejecuta `scripts/tutorials/vision.py` y las cifras salen de esa ejecución (ADR-0006).
  - **Texto: clasificar reseñas** (PyTorch y Hugging Face, reseñas de Amazon en español): 8
    lecciones y 24 ejercicios, de un baseline TF-IDF a ajustar BETO. Lo ejecuta
    `scripts/tutorials/texto.py`.
  - Próximos: IA generativa de imágenes y crea tu LLM.
  - **FastAPI**: 12 lecciones, 2 simulaciones y 47 ejercicios que construyen la API de un modelo
    de calidad de vinos (con FastAPI de verdad ejecutándose en el navegador, ver ADR-0005).
- Funciona en local con Docker. Sin cuentas ni servidor: el progreso se guarda en el navegador.
- El Python de los ejercicios (numpy, pandas, scikit-learn, matplotlib, NLTK, OpenCV…) se ejecuta con
  Pyodide, que se descarga de un CDN la primera vez (hace falta conexión).

## MAIN DEPENDENCIES

![Node JS](https://img.shields.io/badge/NODE.JS-22.22+-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/REACT-19.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TYPESCRIPT-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/VITE-8.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/REACT%20ROUTER-8.5.1-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![MDX](https://img.shields.io/badge/MDX-3.1.1-1B1F24?style=for-the-badge&logo=mdx&logoColor=white)
![KaTeX](https://img.shields.io/badge/KATEX-0.19.1-008080?style=for-the-badge&logo=katex&logoColor=white)
![Shiki](https://img.shields.io/badge/SHIKI-4.5.0-F28C28?style=for-the-badge)
![CodeMirror](https://img.shields.io/badge/REACT%20CODEMIRROR-4.25.12-D30707?style=for-the-badge&logo=codemirror&logoColor=white)
![Pyodide](https://img.shields.io/badge/PYODIDE-314.0.7-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Lucide](https://img.shields.io/badge/LUCIDE%20REACT-1.61.0-F56565?style=for-the-badge&logo=lucide&logoColor=white)
![Vitest](https://img.shields.io/badge/VITEST-5.0.5-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Testing Library](https://img.shields.io/badge/TESTING%20LIBRARY-16.3.3-E33332?style=for-the-badge&logo=testinglibrary&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLINT-9.39.5-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/PRETTIER-3.9.10-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)
![pnpm](https://img.shields.io/badge/PNPM-12.11.2-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![PyTorch](https://img.shields.io/badge/PYTORCH-2.13.0-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![torchvision](https://img.shields.io/badge/TORCHVISION-0.28.0-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Transformers](https://img.shields.io/badge/TRANSFORMERS-5.20.2-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Docker](https://img.shields.io/badge/DOCKER-NGINX%201.31.2-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Arrancar

```bash
docker compose up -d --build      # http://localhost:3100  (cambia el puerto con REPASO_PORT)
```

Para desarrollar:

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm test           # Vitest
pnpm lint
pnpm typecheck
pnpm build
```

## Imágenes del TFM (solo en local)

Las radiografías, mapas de activación y Grad-CAM salen de pacientes de LUMOS, así que no están
en el repositorio ni en la imagen de Docker (ADR-0004). Se generan con el entorno del TFM y
Docker las monta como volumen:

```bash
../tfm/.venv/bin/python scripts/tfm/export_assets.py --tfm ../tfm      # → public/tfm-local/
../tfm/.venv/bin/python scripts/tfm/experiment_metrics.py --tfm ../tfm # métricas agregadas
```

## Comprobar los ejercicios

`scripts/check_exercises.py` ejecuta la solución de cada ejercicio con su comprobación (y
cada ejemplo ejecutable). Necesita un Python con los mismos paquetes que Pyodide:

```bash
uv venv .venv-check --python 3.13
VIRTUAL_ENV=.venv-check uv pip install numpy==2.4.6 pandas==3.0.2 scikit-learn==1.8.0 scipy matplotlib==3.10.8 networkx==3.6.1 pillow \
  nltk==3.9.4 opencv-python-headless==4.11.0.86 beautifulsoup4==4.14.3 \
  fastapi==0.136.1 starlette==1.0.0 httpx==0.28.1 pydantic==2.12.5 sqlalchemy==2.0.48 bcrypt==5.0.0 anyio==4.13.0
.venv-check/bin/python scripts/check_exercises.py                  # todo
.venv-check/bin/python scripts/check_exercises.py refuerzo/02      # una lección
```

Como en Pyodide, el código puede usar `await` fuera de una función (los ejercicios de FastAPI
llaman a la API con `await client.get(...)`): el comprobador lo compila con ese permiso.

## Verificar los tutoriales de deep learning

El código de PyTorch de los tutoriales se ejecuta fuera de la app, con su propio entorno
(`scripts/tutorials/requirements.txt`: torch, torchvision, transformers y scikit-learn fijados):

```bash
uv venv .venv-tutorials --python 3.13
VIRTUAL_ENV=.venv-tutorials uv pip install -r scripts/tutorials/requirements.txt

.venv-tutorials/bin/python scripts/tutorials/vision.py --data /tmp/cifar --out /tmp/vision   # ~25 min en un M4 con MPS
.venv-tutorials/bin/python scripts/tutorials/texto.py --out /tmp/texto                       # ~1 h en un M4 con MPS
# --quick en cualquiera de los dos: prueba rápida con un subconjunto
python scripts/tutorials/vision_curves.py /tmp/vision/results.json > src/features/simulations/tutorials/vision-runs.ts
cp /tmp/vision/errores.png public/tutorials/vision/errores.png
```

Visión descarga CIFAR-10 (~170 MB) y los pesos de ResNet-18 (~45 MB); Texto, las reseñas en
español del Multilingual Amazon Reviews Corpus (~50 MB) y BETO (~440 MB). Nada de eso se
guarda en el repositorio. Las cifras de las lecciones salen de los `results.json`.

## Cómo está hecho

- Lecciones en MDX (`src/content/`), compiladas en el build con fórmulas (KaTeX) y código
  resaltado (Shiki). Decisiones en [`docs/adr/`](docs/adr/README.md).
- El material original del máster va en `Asignaturas/` (no se versiona).
- Desarrollado con ayuda de Claude Code; la configuración de agentes está en `AGENTS.md` y
  `.claude/`.

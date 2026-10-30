# Repaso

Plataforma personal para repasar las asignaturas del Máster en Inteligencia Artificial: cada
asignatura es una serie de lecciones que resumen el temario en lenguaje cercano, con
**simulaciones** que se pueden tocar y **ejercicios con Python real** (en el navegador, con
pista y solución), y notas de cómo se hace cada cosa en un trabajo real.

- 6 asignaturas · 43 lecciones · 39 simulaciones · 137 ejercicios.
- Una sección del **TFM** (LumosNet sobre LUMOS): 9 lecciones conectadas con el temario, 8
  simulaciones más y la bitácora de experimentos reevaluada.
- Funciona en local con Docker. Sin cuentas ni servidor: el progreso se guarda en el navegador.
- El Python de los ejercicios (numpy, pandas, scikit-learn, matplotlib…) se ejecuta con
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
VIRTUAL_ENV=.venv-check uv pip install numpy==2.4.6 pandas==3.0.2 scikit-learn==1.8.0 scipy matplotlib==3.10.8 networkx==3.6.1 pillow
.venv-check/bin/python scripts/check_exercises.py                  # todo
.venv-check/bin/python scripts/check_exercises.py refuerzo/02      # una lección
```

## Cómo está hecho

- Lecciones en MDX (`src/content/`), compiladas en el build con fórmulas (KaTeX) y código
  resaltado (Shiki). Decisiones en [`docs/adr/`](docs/adr/README.md).
- El material original del máster va en `Asignaturas/` (no se versiona).
- Desarrollado con ayuda de Claude Code; la configuración de agentes está en `AGENTS.md` y
  `.claude/`.

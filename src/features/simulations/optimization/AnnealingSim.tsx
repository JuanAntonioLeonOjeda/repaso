import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  createRng,
  format,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

import { makeCities, randomTour, tourLength, twoOptNeighbour, type Tour } from "./tsp";
import { Sparkline, TspPlot } from "./TspPlot";

type Mode = "sa" | "local";

interface State {
  /** The run's random stream: part of the state, so a restart gets a fresh one. */
  rng: () => number;
  tour: Tour;
  cost: number;
  best: number;
  temperature: number;
  iteration: number;
  history: number[];
  accepted: number;
  worseAccepted: number;
}

export default function AnnealingSim(): ReactNode {
  const [n, setN] = useState(30);
  const [t0, setT0] = useState(200);
  const [cooling, setCooling] = useState(0.995);
  const [mode, setMode] = useState<Mode>("sa");
  const [isPlaying, setIsPlaying] = useState(false);
  const cities = useMemo(() => makeCities(n, 7), [n]);
  const initial = (c = cities): State => {
    const rng = createRng(3);
    const tour = randomTour(c.length, rng);
    const cost = tourLength(c, tour);
    return {
      rng,
      tour,
      cost,
      best: cost,
      temperature: t0,
      iteration: 0,
      history: [cost],
      accepted: 0,
      worseAccepted: 0,
    };
  };
  const [state, setState] = useState<State>(() => initial());

  function restart(): void {
    setIsPlaying(false);
    setState(initial());
  }

  useAnimation(isPlaying && state.temperature > 0.05, 30, () => {
    setState((s) => {
      let { tour, cost, best, temperature, iteration, accepted, worseAccepted } = s;
      for (let k = 0; k < 40; k++) {
        const candidate = twoOptNeighbour(tour, s.rng);
        const c = tourLength(cities, candidate);
        const delta = c - cost;
        // Metropolis rule: always accept better; accept worse with probability e^(−Δ/T)
        const acceptWorse = mode === "sa" && s.rng() < Math.exp(-delta / temperature);
        if (delta < 0 || acceptWorse) {
          if (delta >= 0) worseAccepted++;
          tour = candidate;
          cost = c;
          accepted++;
          best = Math.min(best, c);
        }
        temperature *= cooling;
        iteration++;
      }
      return {
        rng: s.rng,
        tour,
        cost,
        best,
        temperature,
        iteration,
        history: [...s.history, cost].slice(-300),
        accepted,
        worseAccepted,
      };
    });
  });

  return (
    <SimFrame
      title="Recocido simulado en el viajante (TSP)"
      intro="Partimos de una ruta aleatoria. En cada paso se prueba un vecino (invertir un tramo de la ruta, «2-opt»). Las mejoras se aceptan siempre; los empeoramientos, con probabilidad e^(−Δ/T), alta al principio y casi nula al enfriar. Compáralo con la búsqueda local pura."
      onReset={() => {
        setN(30);
        setT0(200);
        setCooling(0.995);
        setMode("sa");
        restart();
      }}
      controls={
        <>
          <Choice
            label="Método"
            value={mode}
            onChange={(v) => {
              setMode(v);
              restart();
            }}
            options={[
              { value: "sa", label: "Recocido" },
              { value: "local", label: "Búsqueda local" },
            ]}
          />
          <Slider
            label="Ciudades"
            value={n}
            min={8}
            max={80}
            onChange={(v) => {
              setN(v);
              setIsPlaying(false);
              setState(initial(makeCities(v, 7)));
            }}
          />
          {mode === "sa" && (
            <>
              <Slider
                label="Temperatura inicial T₀"
                value={t0}
                min={1}
                max={1000}
                onChange={(v) => {
                  setT0(v);
                }}
              />
              <Slider
                label="Enfriamiento α (T ← α·T)"
                value={cooling}
                min={0.95}
                max={0.9995}
                step={0.0005}
                onChange={setCooling}
                format={(v) => v.toFixed(4)}
              />
            </>
          )}
          <ButtonRow>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
            >
              {isPlaying ? "Pausar" : "Optimizar"}
            </SimButton>
            <SimButton onClick={restart}>Nueva ruta inicial</SimButton>
          </ButtonRow>
          <ControlNote>
            Enfriar demasiado rápido (α = 0,95) equivale a búsqueda local: se congela en un mínimo
            local.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Iteraciones" value={state.iteration} />
          <Stat label="Longitud actual" value={format(state.cost, 0)} />
          <Stat label="Mejor vista" value={format(state.best, 0)} />
          {mode === "sa" && <Stat label="Temperatura" value={format(state.temperature, 2)} />}
          <Stat label="Peores aceptadas" value={state.worseAccepted} />
          <Sparkline values={state.history} label="Longitud de la ruta por iteración" />
        </>
      }
    >
      <TspPlot
        cities={cities}
        tour={state.tour}
        label={`Ruta actual de longitud ${format(state.cost, 0)}`}
      />
    </SimFrame>
  );
}

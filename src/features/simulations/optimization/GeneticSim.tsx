import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  ControlNote,
  createRng,
  format,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

import { makeCities, orderCrossover, randomTour, swapMutation, tourLength, type Tour } from "./tsp";
import { Sparkline, TspPlot } from "./TspPlot";

const N_CITIES = 25;

interface Population {
  /** The run's random stream: part of the state, so a restart gets a fresh one. */
  rng: () => number;
  tours: Tour[];
  generation: number;
  bestHistory: number[];
  meanHistory: number[];
}

export default function GeneticSim(): ReactNode {
  const [size, setSize] = useState(60);
  const [mutation, setMutation] = useState(0.15);
  const [tournament, setTournament] = useState(3);
  const [elitism, setElitism] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const cities = useMemo(() => makeCities(N_CITIES, 11), []);
  const fitness = (t: Tour): number => tourLength(cities, t);

  const initial = (popSize = size): Population => {
    const rng = createRng(9);
    return {
      rng,
      tours: range(popSize).map(() => randomTour(N_CITIES, rng)),
      generation: 0,
      bestHistory: [],
      meanHistory: [],
    };
  };
  const [pop, setPop] = useState<Population>(() => initial());

  function select(sorted: readonly Tour[], rng: () => number): Tour {
    // Tournament: pick k at random, keep the fittest. Bigger k = more selective pressure.
    let best: Tour | undefined;
    for (let i = 0; i < tournament; i++) {
      const c = sorted[Math.floor(rng() * sorted.length)];
      if (c && (!best || fitness(c) < fitness(best))) best = c;
    }
    return best ?? sorted[0] ?? [];
  }

  function evolve(): void {
    setPop((p) => {
      const sorted = [...p.tours].sort((a, b) => fitness(a) - fitness(b));
      const next: Tour[] = sorted.slice(0, elitism);
      while (next.length < size) {
        let child = orderCrossover(select(sorted, p.rng), select(sorted, p.rng), p.rng);
        if (p.rng() < mutation) child = swapMutation(child, p.rng);
        next.push(child);
      }
      const costs = next.map(fitness);
      return {
        rng: p.rng,
        tours: next,
        generation: p.generation + 1,
        bestHistory: [...p.bestHistory, Math.min(...costs)].slice(-300),
        meanHistory: [...p.meanHistory, costs.reduce((s, c) => s + c, 0) / costs.length].slice(
          -300,
        ),
      };
    });
  }
  useAnimation(isPlaying, 20, evolve);

  const best = [...pop.tours].sort((a, b) => fitness(a) - fitness(b))[0] ?? [];
  const diversity = new Set(pop.tours.map((t) => t.join(","))).size;

  return (
    <SimFrame
      title="Algoritmo genético para el TSP"
      intro="Una población de rutas evoluciona: se seleccionan las mejores (torneo), se cruzan (order crossover: un trozo de un padre y el orden del otro) y se mutan (intercambiar dos ciudades). La élite pasa intacta a la siguiente generación."
      onReset={() => {
        setSize(60);
        setMutation(0.15);
        setTournament(3);
        setElitism(2);
        setIsPlaying(false);
        setPop(initial(60));
      }}
      controls={
        <>
          <Slider
            label="Tamaño de población"
            value={size}
            min={10}
            max={200}
            step={10}
            onChange={(v) => {
              setSize(v);
              setIsPlaying(false);
              setPop(initial(v));
            }}
          />
          <Slider
            label="Prob. de mutación"
            value={mutation}
            min={0}
            max={1}
            step={0.05}
            onChange={setMutation}
            format={(v) => format(v)}
          />
          <Slider
            label="Tamaño del torneo"
            value={tournament}
            min={1}
            max={10}
            onChange={setTournament}
          />
          <Slider label="Élite" value={elitism} min={0} max={10} onChange={setElitism} />
          <ButtonRow>
            <SimButton onClick={evolve}>1 generación</SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
            >
              {isPlaying ? "Pausar" : "Evolucionar"}
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Torneo = 1 es selección aleatoria (no evoluciona). Sin mutación y torneo grande, la
            diversidad se desploma y se estanca: convergencia prematura.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Generación" value={pop.generation} />
          <Stat label="Mejor ruta" value={format(fitness(best), 0)} />
          <Stat label="Diversidad (rutas distintas)" value={`${diversity}/${pop.tours.length}`} />
          <Sparkline values={pop.bestHistory} label="Mejor longitud por generación" />
          <Sparkline
            values={pop.meanHistory}
            label="Longitud media por generación"
            colour="var(--plot-noise)"
          />
        </>
      }
    >
      <TspPlot
        cities={cities}
        tour={best}
        label={`Mejor ruta de la generación ${pop.generation}`}
      />
    </SimFrame>
  );
}

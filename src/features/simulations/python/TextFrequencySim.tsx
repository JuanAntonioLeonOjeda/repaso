import { useState, type ReactNode } from "react";

import { Choice, ControlNote, SimFrame, Stat, Toggle } from "@/features/simulations/kit";

import { bigrams, mostCommon, processTokens, tokenize } from "./text";

const TEXTS = {
  resenas:
    "El café es muy bueno y el pastel también. Volveremos por el café, pero el servicio fue lento. Los camareros eran amables y los pasteles estaban buenos. El local es pequeño y el café, caro. Un café excelente, con un servicio mejorable.",
  noticia:
    "Los modelos de lenguaje aprenden patrones de grandes cantidades de texto. Para entrenar estos modelos se limpian los textos, se separan en palabras y se cuentan las palabras más frecuentes. Las palabras vacías como el, la o de aparecen en todos los textos y no ayudan a distinguir los temas.",
} as const;
type TextId = keyof typeof TEXTS;
type View = "words" | "bigrams";
const W = 560;
const BAR_H = 22;

export default function TextFrequencySim(): ReactNode {
  const [textId, setTextId] = useState<TextId>("resenas");
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [stemming, setStemming] = useState(false);
  const [view, setView] = useState<View>("words");
  const text = TEXTS[textId];
  const tokens = processTokens(text, { removeStopwords, stemming });
  const counted = mostCommon(view === "words" ? tokens : bigrams(tokens), 8);
  const max = Math.max(1, ...counted.map(([, c]) => c));
  const H = 10 + counted.length * BAR_H;

  return (
    <SimFrame
      title="De texto a frecuencias"
      intro="Lo primero que se hace con texto: partirlo en palabras (tokens), pasarlo a minúsculas y contar. Sin quitar las palabras vacías, ganan «el», «y», «de»; quítalas y aparece de qué habla el texto. La raíz (stemming) junta «pastel» y «pasteles»."
      onReset={() => {
        setTextId("resenas");
        setRemoveStopwords(false);
        setStemming(false);
        setView("words");
      }}
      controls={
        <>
          <Choice
            label="Texto"
            value={textId}
            onChange={setTextId}
            options={[
              { value: "resenas", label: "reseñas de un café" },
              { value: "noticia", label: "texto técnico" },
            ]}
          />
          <Toggle
            label="Quitar palabras vacías (stopwords)"
            isOn={removeStopwords}
            onChange={setRemoveStopwords}
          />
          <Toggle
            label="Reducir a la raíz (stemming simplificado)"
            isOn={stemming}
            onChange={setStemming}
          />
          <Choice
            label="Contar"
            value={view}
            onChange={setView}
            options={[
              { value: "words", label: "palabras" },
              { value: "bigrams", label: "bigramas" },
            ]}
          />
          <ControlNote>
            Con NLTK: <code>word_tokenize</code>, <code>stopwords.words("spanish")</code>,{" "}
            <code>SnowballStemmer("spanish")</code> y <code>FreqDist</code>. Aquí el stemmer solo
            recorta unos pocos sufijos, para que veas la idea.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Tokens"
            value={`${String(tokens.length)} (de ${String(tokenize(text).length)})`}
          />
          <Stat label="Vocabulario" value={new Set(tokens).size} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`Más frecuentes: ${counted.map(([w, c]) => `${w} ${String(c)}`).join(", ")}`}
      >
        {counted.map(([word, count], i) => (
          <g key={word}>
            <text
              x={150}
              y={i * BAR_H + 20}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill="var(--color-ink)"
            >
              {word}
            </text>
            <rect
              x={158}
              y={i * BAR_H + 8}
              width={((W - 200) * count) / max}
              height={BAR_H - 6}
              rx={3}
              fill="var(--subject-color)"
              fillOpacity={0.75}
            />
            <text
              x={162 + ((W - 200) * count) / max}
              y={i * BAR_H + 20}
              fontSize={12}
              fill="var(--color-muted)"
            >
              {count}
            </text>
          </g>
        ))}
      </svg>
    </SimFrame>
  );
}

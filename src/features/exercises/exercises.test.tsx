import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ExerciseScope } from "./exercise-scope";
import { Predict } from "./Predict";
import { Quiz } from "./Quiz";

describe("Quiz", () => {
  it("tells right from wrong and shows the explanation when right", async () => {
    const user = userEvent.setup();
    render(
      <ExerciseScope subject="test" lesson="quiz">
        <Quiz
          id="q"
          options={["Clasificación", "Regresión"]}
          answer={1}
          explanation="Es un número."
        >
          ¿Qué tipo de problema es?
        </Quiz>
      </ExerciseScope>,
    );
    const check = screen.getByRole("button", { name: "Comprobar respuesta" });
    expect(check).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Clasificación" }));
    await user.click(check);
    expect(screen.getByRole("status")).toHaveTextContent("No es esa.");

    await user.click(screen.getByRole("radio", { name: "Regresión" }));
    await user.click(check);
    expect(screen.getByRole("status")).toHaveTextContent("Es un número.");
    expect(screen.getByText("¡Resuelto!")).toBeInTheDocument();
  });
});

describe("Predict", () => {
  it("accepts a decimal comma and reveals hints one by one", async () => {
    const user = userEvent.setup();
    render(
      <Predict
        id="p"
        answer="0.48"
        tolerance={0.001}
        explanation="1 − (0,36 + 0,16)."
        hints={["Pista uno", "Pista dos"]}
      >
        ¿Gini?
      </Predict>,
    );
    await user.click(screen.getByRole("button", { name: "Pista" }));
    expect(screen.getByText("Pista uno")).toBeInTheDocument();
    expect(screen.queryByText("Pista dos")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Tu respuesta"), "0,48");
    await user.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correcto.");
  });
});

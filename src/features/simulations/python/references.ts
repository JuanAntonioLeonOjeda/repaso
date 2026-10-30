/**
 * Hand-written traces of small programs, to draw Python's model: names are labels that point to
 * objects; assignment never copies. Each frame is the state after running `line`.
 */
export interface HeapObject {
  id: string;
  /** What `repr()` would show at that moment. */
  repr: string;
  type: string;
  /** Objects this one contains (drawn as arrows). */
  refs?: readonly string[];
  /** Layout: column 1 next to the names, column 2 for contained objects. */
  col: 1 | 2;
  row: number;
}

export interface Frame {
  /** Index of the line just executed (-1 before starting). */
  line: number;
  names: Readonly<Record<string, string>>;
  objects: readonly HeapObject[];
  note: string;
  output?: string;
}

export interface Scenario {
  id: string;
  title: string;
  code: readonly string[];
  frames: readonly Frame[];
}

const list = (id: string, repr: string, row: number, refs?: readonly string[]): HeapObject => ({
  id,
  repr,
  type: "list",
  col: 1,
  row,
  ...(refs ? { refs } : {}),
});

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "alias",
    title: "Dos nombres, una lista",
    code: ["a = [1, 2, 3]", "b = a", "b.append(4)", "print(a)"],
    frames: [
      {
        line: 0,
        names: { a: "L" },
        objects: [list("L", "[1, 2, 3]", 0)],
        note: "Se crea una lista y el nombre a apunta a ella.",
      },
      {
        line: 1,
        names: { a: "L", b: "L" },
        objects: [list("L", "[1, 2, 3]", 0)],
        note: "b = a no copia nada: b es otra etiqueta para el mismo objeto (a is b es True).",
      },
      {
        line: 2,
        names: { a: "L", b: "L" },
        objects: [list("L", "[1, 2, 3, 4]", 0)],
        note: "append modifica el objeto. Como solo hay uno, el cambio se ve por los dos nombres.",
      },
      {
        line: 3,
        names: { a: "L", b: "L" },
        objects: [list("L", "[1, 2, 3, 4]", 0)],
        note: "Para tener una lista independiente: b = a.copy() o b = list(a).",
        output: "[1, 2, 3, 4]",
      },
    ],
  },
  {
    id: "inmutable",
    title: "Los enteros no cambian",
    code: ["x = 10", "y = x", "y += 1", "print(x, y)"],
    frames: [
      {
        line: 0,
        names: { x: "I10" },
        objects: [{ id: "I10", repr: "10", type: "int", col: 1, row: 0 }],
        note: "x apunta a un objeto int.",
      },
      {
        line: 1,
        names: { x: "I10", y: "I10" },
        objects: [{ id: "I10", repr: "10", type: "int", col: 1, row: 0 }],
        note: "Igual que con la lista: y apunta al mismo objeto.",
      },
      {
        line: 2,
        names: { x: "I10", y: "I11" },
        objects: [
          { id: "I10", repr: "10", type: "int", col: 1, row: 0 },
          { id: "I11", repr: "11", type: "int", col: 1, row: 1 },
        ],
        note: "Un int no se puede modificar: y += 1 crea un objeto nuevo (11) y mueve la etiqueta y. x no se entera.",
      },
      {
        line: 3,
        names: { x: "I10", y: "I11" },
        objects: [
          { id: "I10", repr: "10", type: "int", col: 1, row: 0 },
          { id: "I11", repr: "11", type: "int", col: 1, row: 1 },
        ],
        note: "Con inmutables (int, float, str, tuple) el aliasing nunca da sorpresas.",
        output: "10 11",
      },
    ],
  },
  {
    id: "copia",
    title: "Copia superficial de una lista anidada",
    code: [
      "a = [[1, 2], [3, 4]]",
      "b = a.copy()",
      "b.append([5, 6])",
      "b[0].append(99)",
      "print(a)",
    ],
    frames: [
      {
        line: 0,
        names: { a: "A" },
        objects: [
          list("A", "[[1, 2], [3, 4]]", 0, ["P", "Q"]),
          { id: "P", repr: "[1, 2]", type: "list", col: 2, row: 0 },
          { id: "Q", repr: "[3, 4]", type: "list", col: 2, row: 1 },
        ],
        note: "Una lista que contiene referencias a otras dos listas.",
      },
      {
        line: 1,
        names: { a: "A", b: "B" },
        objects: [
          list("A", "[[1, 2], [3, 4]]", 0, ["P", "Q"]),
          list("B", "[[1, 2], [3, 4]]", 1, ["P", "Q"]),
          { id: "P", repr: "[1, 2]", type: "list", col: 2, row: 0 },
          { id: "Q", repr: "[3, 4]", type: "list", col: 2, row: 1 },
        ],
        note: "copy() crea una lista exterior nueva… pero copia las referencias, no las listas de dentro.",
      },
      {
        line: 2,
        names: { a: "A", b: "B" },
        objects: [
          list("A", "[[1, 2], [3, 4]]", 0, ["P", "Q"]),
          list("B", "[[1, 2], [3, 4], [5, 6]]", 1, ["P", "Q", "R"]),
          { id: "P", repr: "[1, 2]", type: "list", col: 2, row: 0 },
          { id: "Q", repr: "[3, 4]", type: "list", col: 2, row: 1 },
          { id: "R", repr: "[5, 6]", type: "list", col: 2, row: 2 },
        ],
        note: "Añadir a b solo cambia b: las listas exteriores sí son distintas.",
      },
      {
        line: 3,
        names: { a: "A", b: "B" },
        objects: [
          list("A", "[[1, 2, 99], [3, 4]]", 0, ["P", "Q"]),
          list("B", "[[1, 2, 99], [3, 4], [5, 6]]", 1, ["P", "Q", "R"]),
          { id: "P", repr: "[1, 2, 99]", type: "list", col: 2, row: 0 },
          { id: "Q", repr: "[3, 4]", type: "list", col: 2, row: 1 },
          { id: "R", repr: "[5, 6]", type: "list", col: 2, row: 2 },
        ],
        note: "Pero b[0] es la misma lista que a[0]: modificarla se ve desde los dos.",
      },
      {
        line: 4,
        names: { a: "A", b: "B" },
        objects: [
          list("A", "[[1, 2, 99], [3, 4]]", 0, ["P", "Q"]),
          list("B", "[[1, 2, 99], [3, 4], [5, 6]]", 1, ["P", "Q", "R"]),
          { id: "P", repr: "[1, 2, 99]", type: "list", col: 2, row: 0 },
          { id: "Q", repr: "[3, 4]", type: "list", col: 2, row: 1 },
          { id: "R", repr: "[5, 6]", type: "list", col: 2, row: 2 },
        ],
        note: "Para copiar también lo de dentro: copy.deepcopy(a).",
        output: "[[1, 2, 99], [3, 4]]",
      },
    ],
  },
  {
    id: "defecto",
    title: "El argumento por defecto mutable",
    code: [
      "def add(item, bag=[]):",
      "    bag.append(item)",
      "    return bag",
      "r1 = add(1)",
      "r2 = add(2)",
      "print(r1)",
    ],
    frames: [
      {
        line: 0,
        names: { add: "F", "add.__defaults__[0]": "D" },
        objects: [
          { id: "F", repr: "<function add>", type: "function", col: 1, row: 0 },
          list("D", "[]", 1),
        ],
        note: "El valor por defecto se evalúa UNA vez, al ejecutar el def, y se guarda en la función.",
      },
      {
        line: 3,
        names: { add: "F", "add.__defaults__[0]": "D", r1: "D" },
        objects: [
          { id: "F", repr: "<function add>", type: "function", col: 1, row: 0 },
          list("D", "[1]", 1),
        ],
        note: "add(1) usa esa lista guardada, le añade 1 y la devuelve: r1 apunta a ella.",
      },
      {
        line: 4,
        names: { add: "F", "add.__defaults__[0]": "D", r1: "D", r2: "D" },
        objects: [
          { id: "F", repr: "<function add>", type: "function", col: 1, row: 0 },
          list("D", "[1, 2]", 1),
        ],
        note: "add(2) vuelve a usar la MISMA lista. r1 y r2 son el mismo objeto.",
      },
      {
        line: 5,
        names: { add: "F", "add.__defaults__[0]": "D", r1: "D", r2: "D" },
        objects: [
          { id: "F", repr: "<function add>", type: "function", col: 1, row: 0 },
          list("D", "[1, 2]", 1),
        ],
        note: "La solución idiomática: bag=None y dentro «if bag is None: bag = []».",
        output: "[1, 2]",
      },
    ],
  },
];

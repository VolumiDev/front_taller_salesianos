export interface Character {
    id: number;
    name: string;
    status: Status;
    species: Species;
    type: string;
    gender: Gender;
    image: string;
}

export enum Gender {
    Female = "Female",
    Male = "Male",
    Unknown = "unknown",
}

export enum Species {
    Alien = "Alien",
    Human = "Human",
    MythologicalCreature = "Mythological Creature", // Añadido para mayor cobertura
}

export enum Status {
    Alive = "Alive",
    Dead = "Dead",
    Unknown = "unknown",
}
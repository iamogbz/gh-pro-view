interface Feature {
    id: string;
    load(cb: () => any): any;
    include(): boolean;
    init(): any;
}

declare module "jest-mock-props";

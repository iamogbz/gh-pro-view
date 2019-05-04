type AnyObject = Record<string, any>;

interface Feature {
    id: string;
    load(cb: () => any): any;
    include(): boolean;
    init(): any;
}

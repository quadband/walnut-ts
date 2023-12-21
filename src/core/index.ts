//@ts-ignore
import type { WalnutKey } from "./walnut-key"; //DO NOT REMOVE OR CHANGE ME



export class Resolver<T> {

    __signature: string;

    constructor(label: string, resolver: ResolverFn<T>){
        this.__signature = label;
        this.fn = resolver;
    }

    fn: ResolverFn<T>;

    public resolve(): T {
        return this.fn();
    }
}

class _Walnut {

    condition: WalnutKey = null;

    private _resolvers: Map<string, Resolver<any>> = new Map();
    
    public checkResolver(signature: string): boolean {
        return this._resolvers.has(signature);
    }

    public runResolver(hash: string){
        const resolver = this._resolvers.get(hash);
        if(resolver) return resolver.resolve();
    }

    public setCondition = (key: WalnutKey) => {
        this.condition = key;
    }

    public makeResolver<T>(label: string, resolverFn: ResolverFn<T>): Resolver<T> {
        const resolver = new Resolver(label, resolverFn);
        this._resolvers.set(resolver.__signature, resolver);
        return resolver;
    }

}

type ResolverFn<T> = () => T;

export const Walnut = new _Walnut();

export { WalnutKey };
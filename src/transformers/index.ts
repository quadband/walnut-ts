import type { WalnutKey, Resolver } from "../core";

export function $Val<T>(t: Record<WalnutKey, T>): T {
    notTransformed();
    return null as T;
}

export function $PVal<T>(t: Partial<Record<WalnutKey, T>>): T {
    notTransformed();
    return null as T;
}

export function $Resolve<T>(resolver: Resolver<T>): T {
    notTransformed();
    return null as T;
}

export function $OnlyWhen<T>(k: WalnutKey | WalnutKey[], t: T): T {
    notTransformed();
    return null as T;
}

function notTransformed(){
    console.error("It looks like this file wasn't transformed with Walnut-TS");
}
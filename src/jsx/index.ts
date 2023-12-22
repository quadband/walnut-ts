import type { WalnutKey } from "../core";

interface $WalnutProps {
    children?: any;
    key: WalnutKey | WalnutKey[];
}

export function $Walnut(props: $WalnutProps){
    return props.children;
}
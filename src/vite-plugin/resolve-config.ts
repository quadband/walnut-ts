export interface WalnutConfig {
    config?: string;
}

export interface ResWalnutConfig extends Required<WalnutConfig> {}

export function resolveWalnutConfig(conf: WalnutConfig = {}): ResWalnutConfig {

    const resConfig: ResWalnutConfig = {
        config: "somewhere"
    }

    return(resConfig);
}
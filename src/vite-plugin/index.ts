import { transformer, checkIfSelf } from "../compiler";

const walnutPlugin = () => {

    return({
        name: "walnut-ts",
        transform: {
            order: "pre" as const,
            handler(code: string, id: string){
                if(id && (id.endsWith(".ts") || id.endsWith(".tsx")) && !checkIfSelf(id)){
                    const t = transformer(code, id);
                    if(t) return t;
                }
            }
        
        }
    });

}

export default walnutPlugin